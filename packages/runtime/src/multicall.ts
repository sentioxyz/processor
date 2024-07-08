import { EthChainId } from '@sentio/chain'
import { BytesLike, Interface } from 'ethers'

// https://www.multicall3.com/abi#json
const ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      },
      {
        internalType: 'bytes[]',
        name: 'returnData',
        type: 'bytes[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bool',
            name: 'allowFailure',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bool',
            name: 'allowFailure',
            type: 'bool'
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call3Value[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3Value',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'blockAndAggregate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      },
      {
        internalType: 'bytes32',
        name: 'blockHash',
        type: 'bytes32'
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getBasefee',
    outputs: [
      {
        internalType: 'uint256',
        name: 'basefee',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      }
    ],
    name: 'getBlockHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'blockHash',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getBlockNumber',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getChainId',
    outputs: [
      {
        internalType: 'uint256',
        name: 'chainid',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentBlockCoinbase',
    outputs: [
      {
        internalType: 'address',
        name: 'coinbase',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentBlockDifficulty',
    outputs: [
      {
        internalType: 'uint256',
        name: 'difficulty',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentBlockGasLimit',
    outputs: [
      {
        internalType: 'uint256',
        name: 'gaslimit',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentBlockTimestamp',
    outputs: [
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'getEthBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getLastBlockHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'blockHash',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'requireSuccess',
        type: 'bool'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'tryAggregate',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'requireSuccess',
        type: 'bool'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'tryBlockAndAggregate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      },
      {
        internalType: 'bytes32',
        name: 'blockHash',
        type: 'bytes32'
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]

// https://github.com/mds1/multicall/blob/main/deployments.json
const DEPLOYMENTS = [
  {
    name: 'Mainnet',
    chainId: 1,
    url: 'https://etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Kovan',
    chainId: 42,
    url: 'https://kovan.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Rinkeby',
    chainId: 4,
    url: 'https://rinkeby.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Görli',
    chainId: 5,
    url: 'https://goerli.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Ropsten',
    chainId: 3,
    url: 'https://ropsten.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Sepolia',
    chainId: 11155111,
    url: 'https://sepolia.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Holesky',
    chainId: 17000,
    url: 'https://holesky.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Xterio Chain',
    chainId: 112358,
    url: 'https://xterscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Xterio Testnet',
    chainId: 1637450,
    url: 'https://testnet.xterscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Optimism',
    chainId: 10,
    url: 'https://optimistic.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Optimism Kovan',
    chainId: 69,
    url: 'https://kovan-optimistic.etherscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Optimism Görli',
    chainId: 420,
    url: 'https://blockscout.com/optimism/goerli/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    url: 'https://optimism-sepolia.blockscout.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Arbitrum',
    chainId: 42161,
    url: 'https://arbiscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Arbitrum Nova',
    chainId: 42170,
    url: 'https://nova.arbiscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Arbitrum Görli',
    chainId: 421613,
    url: 'https://goerli-rollup-explorer.arbitrum.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    url: 'https://sepolia-explorer.arbitrum.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Arbitrum Rinkeby',
    chainId: 421611,
    url: 'https://testnet.arbiscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Stylus Testnet',
    chainId: 23011913,
    url: 'https://stylus-testnet-explorer.arbitrum.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Polygon',
    chainId: 137,
    url: 'https://polygonscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Mumbai',
    chainId: 80001,
    url: 'https://mumbai.polygonscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Amoy',
    chainId: 80002,
    url: 'https://amoy.polygonscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Polygon zkEVM',
    chainId: 1101,
    url: 'https://zkevm.polygonscan.com/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Polygon zkEVM Testnet',
    chainId: 1442,
    url: 'https://testnet-zkevm.polygonscan.com/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Cardona zkEVM Testnet',
    chainId: 2442,
    url: 'https://cardona-zkevm.polygonscan.com/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Gnosis Chain (xDai)',
    chainId: 100,
    url: 'https://blockscout.com/xdai/mainnet/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Chiado (Gnosis Chain Testnet)',
    chainId: 10200,
    url: 'https://blockscout.chiadochain.net/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Avalanche',
    chainId: 43114,
    url: 'https://snowtrace.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Avalanche Fuji',
    chainId: 43113,
    url: 'https://testnet.snowtrace.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Fantom Testnet',
    chainId: 4002,
    url: 'https://testnet.ftmscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Fantom Opera',
    chainId: 250,
    url: 'https://ftmscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Fantom Sonic',
    chainId: 64240,
    url: 'https://public-sonic.fantom.network/address/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'BNB Smart Chain',
    chainId: 56,
    url: 'https://bscscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'BNB Smart Chain Testnet',
    chainId: 97,
    url: 'https://testnet.bscscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'opBNB Testnet',
    chainId: 5611,
    url: 'https://opbnbscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?p=1&tab=Contract'
  },
  {
    name: 'opBNB Mainnet',
    chainId: 204,
    url: 'https://mainnet.opbnbscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?p=1&tab=Contract'
  },
  {
    name: 'Moonbeam',
    chainId: 1284,
    url: 'https://moonscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Moonriver',
    chainId: 1285,
    url: 'https://moonriver.moonscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Moonbase Alpha Testnet',
    chainId: 1287,
    url: 'https://moonbase.moonscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Palm',
    chainId: 11297108109,
    url: 'https://palm.chainlens.com/contracts/0xca11bde05977b3631167028862be2a173976ca11/sources'
  },
  {
    name: 'Palm Testnet',
    chainId: 11297108099,
    url: 'https://testnet.palm.chainlens.com/contracts/0xca11bde05977b3631167028862be2a173976ca11/sources'
  },
  {
    name: 'Harmony',
    chainId: 1666600000,
    url: 'https://explorer.harmony.one/address/0xcA11bde05977b3631167028862bE2a173976CA11?activeTab=7'
  },
  {
    name: 'Cronos',
    chainId: 25,
    url: 'https://cronoscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Cronos Testnet',
    chainId: 338,
    url: 'https://cronos.org/explorer/testnet3/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Fuse',
    chainId: 122,
    url: 'https://explorer.fuse.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Flare Mainnet',
    chainId: 14,
    url: 'https://flare-explorer.flare.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Songbird Canary Network',
    chainId: 19,
    url: 'https://songbird-explorer.flare.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Coston Testnet',
    chainId: 16,
    url: 'https://coston-explorer.flare.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Coston2 Testnet',
    chainId: 114,
    url: 'https://coston2-explorer.flare.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Boba',
    chainId: 288,
    url: 'https://blockexplorer.boba.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Aurora',
    chainId: 1313161554,
    url: 'https://explorer.mainnet.aurora.dev/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Astar',
    chainId: 592,
    url: 'https://blockscout.com/astar/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Astar zKyoto Testnet',
    chainId: 6038361,
    url: 'https://zkyoto.explorer.startale.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Astar zkEVM',
    chainId: 3776,
    url: 'https://astar-zkevm.explorer.startale.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'OKC',
    chainId: 66,
    url: 'https://www.oklink.com/en/okc/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Heco Chain',
    chainId: 128,
    url: 'https://hecoinfo.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Metis Andromeda',
    chainId: 1088,
    url: 'https://andromeda-explorer.metis.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Metis Goerli',
    chainId: 599,
    url: 'https://goerli.explorer.metisdevops.link/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Metis Sepolia',
    chainId: 59902,
    url: 'https://sepolia-explorer.metisdevops.link/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'RSK',
    chainId: 30,
    url: 'https://explorer.rsk.co/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'RSK Testnet',
    chainId: 31,
    url: 'https://explorer.testnet.rsk.co/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Evmos',
    chainId: 9001,
    url: 'https://evm.evmos.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Evmos Testnet',
    chainId: 9000,
    url: 'https://evm.evmos.dev/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Thundercore',
    chainId: 108,
    url: 'https://viewblock.io/thundercore/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=code'
  },
  {
    name: 'Thundercore Testnet',
    chainId: 18,
    url: 'https://explorer-testnet.thundercore.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Oasis',
    chainId: 42262,
    url: 'https://explorer.emerald.oasis.dev/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Oasis Sapphire',
    chainId: 23294,
    url: 'https://explorer.sapphire.oasis.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Celo',
    chainId: 42220,
    url: 'https://explorer.celo.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Celo Alfajores Testnet',
    chainId: 44787,
    url: 'https://explorer.celo.org/alfajores/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Godwoken',
    chainId: 71402,
    url: 'https://v1.gwscan.com/account/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Godwoken Testnet',
    chainId: 71401,
    url: 'https://gw-explorer.nervosdao.community/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Klaytn',
    chainId: 8217,
    url: 'https://scope.klaytn.com/account/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Klaytn Testnet (Baobab)',
    chainId: 1001,
    url: 'https://baobab.klaytnscope.com/account/0xca11bde05977b3631167028862be2a173976ca11?tabId=contractCode'
  },
  {
    name: 'Milkomeda',
    chainId: 2001,
    url: 'https://explorer-mainnet-cardano-evm.c1.milkomeda.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'KCC',
    chainId: 321,
    url: 'https://explorer.kcc.io/en/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Velas',
    chainId: 106,
    url: 'https://evmexplorer.velas.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Telos',
    chainId: 40,
    url: 'https://www.teloscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#contract'
  },
  {
    name: 'Step Network',
    chainId: 1234,
    url: 'https://stepscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Canto',
    chainId: 7700,
    url: 'https://tuber.build/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Canto Testnet',
    chainId: 7701,
    url: 'https://testnet.tuber.build/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Iotex',
    chainId: 4689,
    url: 'https://iotexscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#transactions'
  },
  {
    name: 'Bitgert',
    chainId: 32520,
    url: 'https://brisescan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Kava',
    chainId: 2222,
    url: 'https://explorer.kava.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Mantle Sepolia Testnet',
    chainId: 5003,
    url: 'https://explorer.sepolia.mantle.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Mantle Testnet',
    chainId: 5001,
    url: 'https://explorer.testnet.mantle.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Mantle',
    chainId: 5000,
    url: 'https://explorer.mantle.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Shardeum Sphinx',
    chainId: 8082,
    url: 'https://explorer.testnet.mantle.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Base Testnet (Goerli)',
    chainId: 84531,
    url: 'https://goerli.basescan.org/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Base Testnet (Sepolia)',
    chainId: 84532,
    url: 'https://base-sepolia.blockscout.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Base',
    chainId: 8453,
    url: 'https://basescan.org/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Kroma Testnet (Sepolia)',
    chainId: 2358,
    url: 'https://sepolia.kromascan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'DeFiChain EVM Mainnet',
    chainId: 1130,
    url: 'https://meta.defiscan.live/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'DeFiChain EVM Testnet',
    chainId: 1131,
    url: 'https://meta.defiscan.live/address/0xcA11bde05977b3631167028862bE2a173976CA11?network=TestNet'
  },
  {
    name: 'Defi Oracle Meta Mainnet',
    chainId: 138,
    url: 'https://blockscout.defi-oracle.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'DFK Chain Test',
    chainId: 335,
    url: 'https://subnets-test.avax.network/defi-kingdoms/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'DFK Chain',
    chainId: 53935,
    url: 'https://subnets.avax.network/defi-kingdoms/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Neon EVM DevNet',
    chainId: 245022926,
    url: 'https://devnet.neonscan.org/address/0xcA11bde05977b3631167028862bE2a173976CA11#contract'
  },
  {
    name: 'Linea Sepolia Testnet',
    chainId: 59141,
    url: 'https://sepolia.lineascan.build/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Linea Goerli Testnet',
    chainId: 59140,
    url: 'https://explorer.goerli.linea.build/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Linea Mainnet',
    chainId: 59144,
    url: 'https://lineascan.build/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Hashbit',
    chainId: 11119,
    url: 'https://explorer.hashbit.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Syscoin',
    chainId: 57,
    url: 'https://explorer.syscoin.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Syscoin Rollux Mainnet',
    chainId: 570,
    url: 'https://explorer.rollux.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Syscoin Tannebaum Testnet',
    chainId: 5700,
    url: 'https://tanenbaum.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Syscoin Tannebaum Rollux',
    chainId: 57000,
    url: 'https://rollux.tanenbaum.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Pulsechain v4 Testnet',
    chainId: 943,
    url: 'https://scan.v4.testnet.pulsechain.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Pulsechain Mainnet',
    chainId: 369,
    url: 'https://scan.pulsechain.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Zora Goerli Testnet',
    chainId: 999,
    url: 'https://testnet.explorer.zora.co/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Zora',
    chainId: 7777777,
    url: 'https://explorer.zora.co/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Zora Sepolia Testnet',
    chainId: 999999999,
    url: 'https://sepolia.explorer.zora.energy/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Darwinia Crab Network',
    chainId: 44,
    url: 'https://crab.subscan.io/account/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'Darwinia Network',
    chainId: 46,
    url: 'https://darwinia.subscan.io/account/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'Chain Verse Mainnet',
    chainId: 5555,
    url: 'https://explorer.chainverse.info/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Scroll Alpha Testnet',
    chainId: 534353,
    url: 'https://blockscout.scroll.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Scroll Sepolia Testnet',
    chainId: 534351,
    url: 'https://sepolia.scrollscan.dev/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Scroll',
    chainId: 534352,
    url: 'https://scrollscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Xodex',
    chainId: 2415,
    url: 'https://explorer.xo-dex.com/contracts/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'EOS EVM Testnet',
    chainId: 15557,
    url: 'https://explorer.testnet.evm.eosnetwork.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'EOS EVM',
    chainId: 17777,
    url: 'https://explorer.evm.eosnetwork.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Crossbell',
    chainId: 3737,
    url: 'https://scan.crossbell.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Dogechain',
    chainId: 2000,
    url: 'https://explorer.dogechain.dog/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'MEVerse Chain Testnet',
    chainId: 4759,
    url: 'https://testnet.meversescan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'MEVerse Chain Mainnet',
    chainId: 7518,
    url: 'https://meversescan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'SKALE Calypso Testnet',
    chainId: 974399131,
    url: 'https://giant-half-dual-testnet.explorer.testnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Europa Testnet',
    chainId: 1444673419,
    url: 'https://juicy-low-small-testnet.explorer.testnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Nebula Testnet',
    chainId: 37084624,
    url: 'https://lanky-ill-funny-testnet.explorer.testnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Titan Testnet',
    chainId: 1020352220,
    url: 'https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Calypso Hub',
    chainId: 1564830818,
    url: 'https://honorable-steel-rasalhague.explorer.mainnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Europa Liquidity Hub',
    chainId: 2046399126,
    url: 'https://elated-tan-skat.explorer.mainnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Nebula Gaming Hub',
    chainId: 1482601649,
    url: 'https://green-giddy-denebola.explorer.mainnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'SKALE Titan AI Hub',
    chainId: 1350216234,
    url: 'https://parallel-stormy-spica.explorer.mainnet.skalenodes.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Ronin Saigon Testnet',
    chainId: 2021,
    url: 'https://saigon-app.roninchain.com/address/ronin:ca11bde05977b3631167028862be2a173976ca11?t=contract'
  },
  {
    name: 'Ronin Mainnet',
    chainId: 2020,
    url: 'https://app.roninchain.com/address/ronin:ca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'Qitmeer Testnet',
    chainId: 8131,
    url: 'https://testnet-qng.qitmeer.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Qitmeer QNG Mainnet',
    chainId: 813,
    url: 'https://qng.meerscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Q Testnet',
    chainId: 35443,
    url: 'https://explorer.qtestnet.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Q Devnet',
    chainId: 35442,
    url: 'https://explorer.qdevnet.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Q Mainnet',
    chainId: 35441,
    url: 'https://explorer.q.org/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Neon Mainnet',
    chainId: 245022934,
    url: 'https://neonscan.org/address/0xca11bde05977b3631167028862be2a173976ca11#contract'
  },
  {
    name: 'LUKSO Testnet',
    chainId: 4201,
    url: 'https://explorer.execution.testnet.lukso.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'LUKSO Mainnet',
    chainId: 42,
    url: 'https://explorer.execution.mainnet.lukso.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Edgeware EdgeEVM',
    chainId: 2021,
    url: 'https://edgscan.live/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts'
  },
  {
    name: 'Meter Testnet',
    chainId: 83,
    url: 'https://scan-warringstakes.meter.io/address/0xca11bde05977b3631167028862be2a173976ca11?tab=0&p=1'
  },
  {
    name: 'Meter',
    chainId: 82,
    url: 'https://scan.meter.io/address/0xca11bde05977b3631167028862be2a173976ca11?tab=0&p=1'
  },
  {
    name: 'Sepolia PGN (Public Goods Network) Testnet',
    chainId: 58008,
    url: 'https://explorer.sepolia.publicgoods.network/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'PGN (Public Goods Network)',
    chainId: 424,
    url: 'https://explorer.publicgoods.network/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'ShimmerEVM',
    chainId: 148,
    url: 'https://explorer.evm.shimmer.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Highbury EVM',
    chainId: 710,
    url: 'https://explorer.furya.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Arthera Testnet',
    chainId: 10243,
    url: 'https://explorer-test.arthera.net/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Arthera Mainnet',
    chainId: 10242,
    url: 'https://explorer.arthera.net/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Manta Pacific Mainnet',
    chainId: 169,
    url: 'https://pacific-explorer.manta.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Jolnir (Taiko Testnet)',
    chainId: 167007,
    url: 'https://explorer.jolnir.taiko.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Katla (Taiko A6 Testnet)',
    chainId: 167008,
    url: 'https://explorer.katla.taiko.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Filecoin Mainnet',
    chainId: 314,
    url: 'https://filfox.info/en/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Filecoin Calibration Testnet',
    chainId: 314159,
    url: 'https://calibration.filscan.io/en/tx/0xdbfa261cd7d17bb40479a0493ad6c0fee435859e37aae73aa7e803f3122cc465/'
  },
  {
    name: 'Fusion',
    chainId: 32659,
    url: 'https://fsnscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#contract'
  },
  {
    name: 'Fusion Testnet',
    chainId: 46688,
    url: 'https://testnet.fsnscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#contract'
  },
  {
    name: 'Xai Testnet',
    chainId: 47279324479,
    url: 'https://testnet-explorer.xai-chain.net/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'JFIN Chain',
    chainId: 3501,
    url: 'https://jfinscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'JFIN Chain Testnet',
    chainId: 3502,
    url: 'https://testnet.jfinscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Chiliz Chain',
    chainId: 88888,
    url: 'https://scan.chiliz.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Chiliz Spicy Testnet',
    chainId: 88882,
    url: 'https://testnet.chiliscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11/contract/88882/code'
  },
  {
    name: 'CORE',
    chainId: 1116,
    url: 'https://scan.coredao.org/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Core Testnet',
    chainId: 1115,
    url: 'https://scan.test.btcs.network/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Ethereum Classic',
    chainId: 61,
    url: 'https://etc.blockscout.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Frame Testnet',
    chainId: 68840142,
    url: 'https://explorer.testnet.frame.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Etherlink Mainnet',
    chainId: 42793,
    url: 'https://explorer.etherlink.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Etherlink Testnet',
    chainId: 128123,
    url: 'https://testnet-explorer.etherlink.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'ZetaChain Athens 3 Testnet',
    chainId: 7001,
    url: 'https://explorer.zetachain.com/address/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'ZetaChain ',
    chainId: 7000,
    url: 'https://explorer.zetachain.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'X1 Testnet',
    chainId: 195,
    url: 'https://www.oklink.com/x1-test/address/0xca11bde05977b3631167028862be2a173976ca11/contract'
  },
  {
    name: 'Lumiterra Layer3',
    chainId: 94168,
    url: 'https://scan.layerlumi.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'BitTorrent Chain Mainnet',
    chainId: 199,
    url: 'https://bttcscan.com/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'BTT Chain Testnet',
    chainId: 1029,
    url: 'https://testnet.bttcscan.com/address/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'Callisto Mainnet',
    chainId: 820,
    url: 'https://explorer.callisto.network/address/0xcA11bde05977b3631167028862bE2a173976CA11/transactions'
  },
  {
    name: 'Areon Network Testnet',
    chainId: 462,
    url: 'https://areonscan.com/contracts/0xca11bde05977b3631167028862be2a173976ca11?page=0'
  },
  {
    name: 'Areon Network Mainnet',
    chainId: 463,
    url: 'https://areonscan.com/contracts/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'zkFair Mainnet',
    chainId: 42766,
    url: 'https://scan.zkfair.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'Mode Mainnet',
    chainId: 34443,
    url: 'https://explorer.mode.network/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Blast Sepolia',
    chainId: 168587773,
    url: 'https://testnet.blastscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11/contract/168587773/code'
  },
  {
    name: 'Blast',
    chainId: 81457,
    url: 'https://blastscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Xai',
    chainId: 660279,
    url: 'https://explorer.xai-chain.net/address/0xcA11bde05977b3631167028862bE2a173976CA11/contracts#address-tabs'
  },
  {
    name: 'DOS Chain',
    chainId: 7979,
    url: 'https://doscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'DOS Chain Testnet',
    chainId: 3939,
    url: 'https://test.doscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Tron',
    chainId: 728126428,
    url: 'https://tronscan.org/#/contract/TEazPvZwDjDtFeJupyo7QunvnrnUjPH8ED/code',
    address: 'TEazPvZwDjDtFeJupyo7QunvnrnUjPH8ED'
  },
  {
    name: 'zkSync Era',
    chainId: 324,
    url: 'https://explorer.zksync.io/address/0xF9cda624FBC7e059355ce98a31693d299FACd963#contract',
    address: '0xF9cda624FBC7e059355ce98a31693d299FACd963'
  },
  {
    name: 'zkSync Era Goerli Testnet',
    chainId: 280,
    url: 'https://goerli.explorer.zksync.io/address/0xF9cda624FBC7e059355ce98a31693d299FACd963#contract',
    address: '0xF9cda624FBC7e059355ce98a31693d299FACd963'
  },
  {
    name: 'zkSync Era Sepolia Testnet',
    chainId: 300,
    url: 'https://sepolia.explorer.zksync.io/address/0xF9cda624FBC7e059355ce98a31693d299FACd963#contract',
    address: '0xF9cda624FBC7e059355ce98a31693d299FACd963'
  },
  {
    name: 'PlayFi Albireo Testnet',
    chainId: 1612127,
    url: 'https://albireo-explorer.playfi.ai/address/0xF9cda624FBC7e059355ce98a31693d299FACd963#contract',
    address: '0xF9cda624FBC7e059355ce98a31693d299FACd963'
  },
  {
    name: 'Fraxtal Mainnet',
    chainId: 252,
    url: 'https://fraxscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Fraxtal Holesky Testnet',
    chainId: 2522,
    url: 'https://holesky.fraxscan.com/address/0xcA11bde05977b3631167028862bE2a173976CA11#code'
  },
  {
    name: 'Omax Mainnet',
    chainId: 311,
    url: 'https://omaxray.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Syndicate Frame Chain',
    chainId: 5101,
    url: 'https://explorer-frame.syndicate.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Dela Sepolia',
    chainId: 9393,
    url: 'https://sepolia-delascan.deperp.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'NeoX Testnet',
    chainId: 12227330,
    url: 'https://xt2scan.ngd.network/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Sanko Testnet',
    chainId: 1992,
    url: 'https://testnet.sankoscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Berachain Testnet (Artio)',
    chainId: 80085,
    url: 'https://artio.beratrail.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Shibarium',
    chainId: 109,
    url: 'https://www.shibariumscan.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Immutable zkEVM Mainnet',
    chainId: 13371,
    url: 'https://explorer.immutable.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Immutable zkEVM Testnet',
    chainId: 13473,
    url: 'https://explorer.testnet.immutable.com/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'RSS3 VSL Mainnet',
    chainId: 12553,
    url: 'https://scan.rss3.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'RSS3 VSL Sepolia Testnet',
    chainId: 2331,
    url: 'https://scan.testnet.rss3.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Morph Sepolia Testnet',
    chainId: 2710,
    url: 'https://explorer-testnet.morphl2.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'JIBCHAIN L1',
    chainId: 8899,
    url: 'https://exp-l1.jibchain.net/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Haqq Mainnet',
    chainId: 11235,
    url: 'https://explorer.haqq.network/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Zircuit Sepolia Testnet',
    chainId: 48899,
    url: 'https://explorer.zircuit.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?activeTab=3'
  },
  {
    name: 're.al',
    chainId: 111188,
    url: 'https://explorer.re.al/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Merlin Testnet',
    chainId: 686868,
    url: 'https://testnet-scan.merlinchain.io/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'IOTA EVM',
    chainId: 8822,
    url: 'https://iota-evm.blockscout.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Planq',
    chainId: 7070,
    url: 'https://evm.planq.network/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Cyber Testnet',
    chainId: 111557560,
    url: 'https://testnet.cyberscan.co/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Unit Zero Stagenet',
    chainId: 88819,
    url: 'https://explorer-stagenet.unit0.dev/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Unit Zero Testnet',
    chainId: 88817,
    url: 'https://explorer-testnet.unit0.dev/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  },
  {
    name: 'Sei EVM Devnet',
    chainId: 713715,
    url: 'https://seitrace.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Sei EVM Mainnet',
    chainId: 1329,
    url: 'https://seitrace.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?chain=pacific-1&tab=contract'
  },
  {
    name: 'Hekla (Taiko A7 Testnet)',
    chainId: 167009,
    url: 'https://explorer.hekla.taiko.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Taiko Mainnet',
    chainId: 167000,
    url: 'https://taikoscan.io/address/0xca11bde05977b3631167028862be2a173976ca11#code'
  },
  {
    name: 'Cyber Mainnet',
    chainId: 7560,
    url: 'https://cyberscan.co/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'DreyerX Mainnet',
    chainId: 23451,
    url: 'https://scan.dreyerx.com/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Sahara Testnet',
    chainId: 313313,
    url: 'https://explorer.saharaa.info/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'BOX Chain',
    chainId: 42299,
    url: 'https://explorerl2new-boxchain-t4zoh9y5dr.t.conduit.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'OX Chain',
    chainId: 6699,
    url: 'https://explorer-ox-chain-2s86s7wp21.t.conduit.xyz/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Conflux Espace',
    chainId: 1030,
    url: 'https://evm.confluxscan.net/address/0xca11bde05977b3631167028862be2a173976ca11?tab=contract-viewer'
  },
  {
    name: 'BEVM Testnet',
    chainId: 11503,
    url: 'https://scan-testnet.bevm.io/address/0xcA11bde05977b3631167028862bE2a173976CA11?tab=contract'
  },
  {
    name: 'Aura Mainnet',
    chainId: 6322,
    url: 'https://aurascan.io/evm-contracts/0xca11bde05977b3631167028862be2a173976ca11'
  },
  {
    name: 'Superposition Testnet',
    chainId: 98985,
    url: 'https://testnet-explorer.superposition.so/address/0xcA11bde05977b3631167028862bE2a173976CA11'
  }
]

const chainToDeploymentMap = Object.fromEntries(
  DEPLOYMENTS.map((deployment) => {
    const p = deployment.url.indexOf('0x')
    const address = p > -1 ? deployment.url.slice(p, p + 42) : '0x' + deployment.url.slice(-40)
    return [deployment.chainId.toString() as EthChainId, address]
  })
)

export interface Multicall3Call {
  target: string
  callData: string
}

export interface AggregateResult {
  blockNumber: bigint
  returnData: string[]
}

const iface = new Interface(ABI)

export function encodeMulticallData(calls: Array<Multicall3Call>) {
  return iface.encodeFunctionData('aggregate', [calls])
}

export function decodeMulticallResult(data: BytesLike): AggregateResult {
  return iface.decodeFunctionResult('aggregate', data).toObject() as AggregateResult
}

export function getMulticallAddress(chainId: EthChainId): string | undefined {
  return chainToDeploymentMap[chainId]
}
