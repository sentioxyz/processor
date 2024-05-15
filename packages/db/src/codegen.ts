import {
  DirectiveNode, GraphQLEnumType,
  GraphQLField, GraphQLInterfaceType, GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType, GraphQLScalarType,
  GraphQLSchema, Kind
} from 'graphql'
import * as fs from 'node:fs'
import path from 'path'
import mkdirp from 'mkdirp'




export async function codegen(schema: GraphQLSchema, outputDir: string) {
  const results: string[] = ["import {entity, derivedFrom} from '@sentio/db'",
    "import {BigDecimal} from '@sentio/bigdecimal'"
  ]

  for(const t of Object.values(schema.getTypeMap())){
    if (t.name.startsWith('__')) {
      continue
    }

    if (t instanceof GraphQLObjectType) {
      const entityContent = genEntity(t)
      results.push(entityContent)
    }
    if (t instanceof GraphQLEnumType) {
      results.push(genEnum(t))
    }
  }

  const contents =  results.join('\n')
  const filePath = path.join(outputDir, 'schema.ts')
  await mkdirp(path.dirname(filePath))
  fs.writeFileSync(filePath, contents)
}

const JsTypes: Record<string, string> =  {
  'ID': 'string',
  'String': 'string',
  'Int': 'number',
  'Float': 'number',
  'Boolean': 'boolean',
  'BigInt': 'bigint',
  'BigDecimal': 'BigDecimal',
  'DateTime': 'Date',
  'Json': 'any',
  'Bytes': 'Uint8Array',
}
const graphqlTypes = Object.entries(JsTypes).reduce((acc, [k, v]) => {
  acc[v] = k
  return acc
}, {} as Record<string, string>)

function genType(type: GraphQLOutputType): string {
  if (type instanceof GraphQLNonNull) {
    return genType(type.ofType)
  } else if (type instanceof GraphQLScalarType) {
    return JsTypes[type.name]
  } else if (type instanceof GraphQLObjectType ||  type instanceof GraphQLInterfaceType){
    return type.name
  } else if (type instanceof GraphQLList) {
    return `Array<${genType(type.ofType)}>`
  } else if (type instanceof GraphQLEnumType) {
    return type.name
  }
  else {
    throw new Error('Unsupported type: ' + type)
  }
}

function genField(field: GraphQLField<any, any>) {
    const isNonNull = field.type instanceof GraphQLNonNull
    const directives = field.astNode?.directives?.map(d=> "\t"+directive2decorator(d)+"\n") || []

    return `${directives.join()}\t${field.name}${isNonNull ? '!': '?'}: ${genType(field.type)}`
}

function genEntity(t: GraphQLObjectType<any, any>) {
  const decorators = t.astNode?.directives?.map(directive2decorator) || []

  return `
${decorators.join('\n')}
export class ${t.name} {
  constructor(props?: Partial<${t.name}>) {
    Object.assign(this, props)
  }
${Object.values(t.getFields()).map(genField).join('\n')}
}`
}

export function directive2decorator(directive: DirectiveNode) {
  let s =  `@${directive.name.value}`
  if (directive.arguments?.length) {
    s += `(${directive.arguments?.map((arg) =>{ 
      return arg.value.kind === Kind.STRING ?  `"${arg.value.value}"`: `${arg.value}` 
    }).join(', ')})`
  }
  return s
}

function genEnum(t: GraphQLEnumType) {
  return `export enum ${t.name} {
    ${t.getValues().map(v => `\t${v.name}`).join(', ')}
}`
}