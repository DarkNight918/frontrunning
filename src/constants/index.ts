const ethers = require('ethers')
require('dotenv').config()


export const PAN_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
export const UNI_WOUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
export const BNB_CONTRACT = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'

export default function erc20(account: any, tokenAddress: string) {
    return new ethers.Contract(
        tokenAddress,
        [{
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "payable": false,
            "type": "function"
        },
        { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
        {
            "constant": false,
            "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }],
            "name": "approve",
            "outputs": [{ "name": "", "type": "bool" }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        ],
        account
    );
}

export function router(account: any) {
    return new ethers.Contract(
        PAN_ROUTER_ADDRESS!,
        [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
            'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
            'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
            'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
            'function swapExactTokensForETH (uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
        ],
        account
    );
}

export const iface = new ethers.utils.Interface(['function    swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)',
    'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline)'])



//'0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
