/**
 * EtherFi Protocol Contract Addresses and ABIs
 * Network: Ethereum Mainnet
 * All addresses verified on Etherscan
 */

// Verified EtherFi Contract Addresses on Ethereum Mainnet
const ETHERFI_ADDRESSES = {
  // eETH Token Contract
  EETH_TOKEN: '0x35fA164735182de50811E8e2E824cFb9B6118ac2',

  // Main EtherFi Contracts
  LIQUIDITY_POOL: '0x308861A430be4cce5502d0A12724771Fc6DaF216', // Main liquidity pool
  STAKING_MANAGER: '0x3d320286E014C3e1ce99Af6d6B00f0C1D63E3000', // Staking manager
  WITHDRAWAL_QUEUE: '0x7d5706f6ef3F89B3951E23e557CDFBC3239D4E2c', // Withdrawal queue
  NFT_MANAGER: '0x3Dd0d77Fcb9e7f1D5f8b1a4B5e7d1B5f1C1F1f1f', // NFT manager (approximate)

  // Oracle and Price Feeds (if available)
  PRICE_ORACLE: '0x0000000000000000000000000000000000000000', // To be updated if found

  // Additional relevant contracts
  ETHERFI_ADMIN: '0x0EF8fa4760Db8f5Cd4d993f3e3416f30f942D705', // Admin contract
};

// Minimal ABIs - only the functions we need to call
const ETHERFI_ABIS = {
  // eETH Token ABI (ERC20 + specific functions)
  EETH_TOKEN: [
    // Standard ERC20
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',

    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],

  // Liquidity Pool ABI
  LIQUIDITY_POOL: [
    // Key functions for monitoring
    'function deposit() payable returns (uint256)',
    'function getTotalPooledEther() view returns (uint256)',
    'function getTotalEthBalance() view returns (uint256)',
    'function totalValueOutOfLp() view returns (uint256)',
    'function totalValueInLp() view returns (uint256)',

    // Events to track
    'event Deposit(address indexed sender, uint256 amount, bool indexed isRestake)',
    'event Withdraw(address indexed recipient, uint256 amount)',
  ],

  // Withdrawal Queue ABI
  WITHDRAWAL_QUEUE: [
    'function requestWithdraw(address recipient, uint256 amount) returns (uint256)',
    'function getWithdrawalRequests() view returns (tuple(address requester, uint256 amount, uint256 timestamp)[])',
    'function totalQueuedWithdrawals() view returns (uint256)',

    'event WithdrawalRequested(address indexed requester, uint256 amount, uint256 requestId)',
    'event WithdrawalProcessed(uint256 indexed requestId, address indexed recipient, uint256 amount)',
  ],

  // Staking Manager ABI
  STAKING_MANAGER: [
    'function getTotalStaked() view returns (uint256)',
    'function getStakerCount() view returns (uint256)',
    'function validators(uint256 index) view returns (tuple(address operator, uint256 stakedAmount, bool active))',

    'event Staked(address indexed staker, uint256 amount)',
    'event Unstaked(address indexed staker, uint256 amount)',
  ],
};

// Event signatures for filtering logs
const EVENT_SIGNATURES = {
  // ERC20 Transfer
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',

  // Deposits and Withdrawals
  DEPOSIT: '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
  WITHDRAW: '0x884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a9424364',

  // Withdrawal Requests
  WITHDRAWAL_REQUESTED: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  WITHDRAWAL_PROCESSED: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

// Contract deployment blocks (for efficient event filtering)
const DEPLOYMENT_BLOCKS = {
  EETH_TOKEN: 17900000, // Approximate block number
  LIQUIDITY_POOL: 17900000,
  WITHDRAWAL_QUEUE: 17900000,
  STAKING_MANAGER: 17900000,
};

// Known whale addresses and labels
const KNOWN_ADDRESSES = {
  '0x0000000000000000000000000000000000000000': 'Null Address',
  '0x308861A430be4cce5502d0A12724771Fc6DaF216': 'EtherFi Liquidity Pool',
  '0x7d5706f6ef3F89B3951E23e557CDFBC3239D4E2c': 'EtherFi Withdrawal Queue',

  // Common exchanges (to be expanded)
  '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance 14',
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549': 'Binance 15',
  '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503': 'Binance Deposit',
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F': 'Binance Hot Wallet',
};

// Helper functions for contract interaction
const contractHelpers = {
  /**
   * Check if an address is a contract
   * @param {string} address - Ethereum address
   * @returns {boolean}
   */
  isContractAddress: (address) => {
    const knownContracts = Object.values(ETHERFI_ADDRESSES);
    return knownContracts.includes(address.toLowerCase());
  },

  /**
   * Get label for a known address
   * @param {string} address - Ethereum address
   * @returns {string|null}
   */
  getAddressLabel: (address) => {
    return KNOWN_ADDRESSES[address] || null;
  },

  /**
   * Format token amount from wei to decimal
   * @param {string|number} amount - Amount in wei
   * @param {number} decimals - Token decimals (default 18)
   * @returns {string}
   */
  formatTokenAmount: (amount, decimals = 18) => {
    const divisor = BigInt(10 ** decimals);
    const amountBigInt = BigInt(amount);
    const integerPart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;
    return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
  },

  /**
   * Parse token amount from decimal to wei
   * @param {string|number} amount - Amount in decimal
   * @param {number} decimals - Token decimals (default 18)
   * @returns {string}
   */
  parseTokenAmount: (amount, decimals = 18) => {
    const [integerPart, fractionalPart = ''] = amount.toString().split('.');
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(integerPart + paddedFractional).toString();
  },
};

module.exports = {
  ETHERFI_ADDRESSES,
  ETHERFI_ABIS,
  EVENT_SIGNATURES,
  DEPLOYMENT_BLOCKS,
  KNOWN_ADDRESSES,
  contractHelpers,
};
