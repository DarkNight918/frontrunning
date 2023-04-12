const ethers = require('ethers')
import { BigNumber, Wallet } from "ethers";
import { banned, safu } from "../constants/lists";
import erc20, { BNB_CONTRACT, PAN_ROUTER_ADDRESS, router } from "../constants";
import { abi, swapAbi } from "../constants/abis";

let tradePending = false
let sellPending = false

export const sellToken = async (account: Wallet, tokenContract: string, gasLimit: BigNumber, gasPrice: BigNumber, value = 99) => {

    try {
        const sellTokenContract = new ethers.Contract(tokenContract, swapAbi, account)
        const contract = new ethers.Contract(PAN_ROUTER_ADDRESS!, abi, account)
        const accountAddress = account.address
        const tokenBalance = await erc20(account, tokenContract).balanceOf(accountAddress);
        let amountOutMin = 0;
        let slippage = 50;
        const amountIn = tokenBalance.mul(value).div(100)

        const amounts = await router(account).getAmountsOut(amountIn, [BNB_CONTRACT, tokenContract]);
        amountOutMin = amounts[1].sub(amounts[1].div(100).mul(slippage));

        // amountOutMin = amounts[1]

        const approve = await sellTokenContract.approve(PAN_ROUTER_ADDRESS, amountIn)
        const receipt_approve = await approve.wait();

        if (receipt_approve && receipt_approve.blockNumber && receipt_approve.status === 1) {
            console.log(`Approved`);

            const swap_txn = await contract.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn, amountOutMin,
                [tokenContract, BNB_CONTRACT],
                accountAddress,
                (Date.now() + 1000 * 60 * 10),
                { 'gasLimit': gasLimit, 'gasPrice': gasPrice, })

            const receipt = await swap_txn.wait();
            if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
                process.stdout.write(`Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status success`);
                tradePending = false
            } else if (receipt && receipt.blockNumber && receipt.status === 0) {
                process.stdout.write(`Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status failed`);
                tradePending = false
            } else {
                process.stdout.write(`Transaction https://bscscan.com/tx/${receipt.transactionHash} not mined`);
                tradePending = false
            }
        }
        console.log('excecution finished, waiting on txn')
        return tradePending = false
    }
    catch (err) {
        console.log(err)
        return tradePending = false
    }

}

export const buyToken = async (account: any, tokenContract: string, gasLimit: any, gasPrice: any) => {
    if (tradePending) return console.log('trade pending')
    tradePending = true;
    //buyAmount how much are we going to pay for example 0.1 BNB
    const buyAmount = 0.05
    //Slippage refers to the difference between the expected price of a trade and the price at which the trade is executed
    const slippage = 50
    //amountOutMin how many token we are going to receive
    let amountOutMin = 0;
    const amountIn = ethers.utils.parseUnits(buyAmount.toString(), 'ether');

    //  remove if slippage === 0
    const amounts = await router(account).getAmountsOut(amountIn, [BNB_CONTRACT, tokenContract]);
    amountOutMin = amounts[1].sub(amounts[1].div(100).mul(slippage));
    //

    console.log(amountIn, gasLimit, gasPrice);
    try {
        const tx = await router(account).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [BNB_CONTRACT, tokenContract],
            account.address,
            (Date.now() + 1000 * 60 * 10),
            { 'value': amountIn, 'gasLimit': gasLimit, 'gasPrice': gasPrice, },);

        const receipt = await tx.wait();
        if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
            console.log(`Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status success`);
        } else if (receipt && receipt.blockNumber && receipt.status === 0) {
            console.log(`Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status failed`);
        } else {
            console.log(`Transaction https://bscscan.com/tx/${receipt.transactionHash} not mined`);
        }
    } catch (err) {
        console.log(err)
    }
}

export function returnsTrueIfBanned(address: string) {
    for (let v in banned) {
        if (banned[v] === address) return true;
    };
    return false
}

export function returnTrueIfSafu(address: string) {
    for (let v in safu) {
        if (safu[v] === address) return true;
    }
    return true
}