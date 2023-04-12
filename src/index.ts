import calculate_gas_price from "./util/calculategas";
import * as dotenv from 'dotenv'
import { ethers } from 'ethers'
import { iface, UNI_WOUTER } from "./constants";
import { buyToken, returnTrueIfSafu, sellToken } from "./util";
const express = require("express");
const http = require('http');
const Web3 = require("web3")
const app = express();
const PORT = process.env.PORT || 3880 || 3001;
const wss = process.env.WSS
const web3 = new Web3(wss)
dotenv.config({ path: '.env' })

var init = async function () {
  const customWsProvider = new ethers.providers.WebSocketProvider(process.env.WSS!, { name: 'binance', chainId: 56 });

  const wallet = new ethers.Wallet(process.env.SECRET!);
  const account = wallet.connect(customWsProvider);

  customWsProvider.on("pending", (tx: string) => {
    customWsProvider.getTransaction(tx).then(async function (transaction: any) {
      if (transaction && transaction.to === UNI_WOUTER && transaction.gasPrice) {
        const value = web3.utils.fromWei(transaction.value.toString())
        const gasPrice = web3.utils.fromWei(transaction.gasPrice.toString())
        const gasLimit = web3.utils.fromWei(transaction.gasLimit.toString())

        // track buys above 1 ETH
        if (parseInt(value) > 0) {
          console.log("value : ", value);
          console.log("gasPrice : ", gasPrice);
          console.log("gasLimit : ", gasLimit);
          console.log("from", transaction.from);
          let result: any = [];
          try {
            result = iface.decodeFunctionData('swapExactETHForTokens', transaction.data)
          } catch (error) {
            try {
              result = iface.decodeFunctionData('swapExactETHForTokensSupportingFeeOnTransferTokens', transaction.data)
            } catch (error) {
              try {
                result = iface.decodeFunctionData('swapETHForExactTokens', transaction.data)
              } catch (error) {
                console.log("final err : ", { hash: transaction.hash, data: transaction.data });
              }
            }
          }
          if (result.length > 0) {
            let tokenAddress = ""
            if (result[1].length > 0) {
              tokenAddress = result[1][1]
              console.log("tokenAddress", tokenAddress);
              if (returnTrueIfSafu(result[1][1])) {
                const buyGasPrice = calculate_gas_price("buy", transaction.gasPrice)
                const sellGasPrice = calculate_gas_price("sell", transaction.gasPrice)
                // after calculating the gas price we buy the token
                console.log("going to buy");
                await buyToken(account, tokenAddress, transaction.gasLimit, buyGasPrice)
                // after buying the token we sell it 
                console.log("going to sell the token");
                await sellToken(account, tokenAddress, transaction.gasLimit, sellGasPrice)
              }
              return console.log('Address failed safu check')
            }
          }
        }
      }
    }
    );
  });

  customWsProvider._websocket.on("error", async (ep: any) => {
    let count: number = 3;
    const interval = setInterval(() => {
      if (count === 0) return
      count--
      process.stdout.write(`Unable to connect to ${ep.subdomain} retrying in ${count}s...\r`);
    })
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
    setTimeout(() => {
      process.stdout.clearLine(0)
      // process.stdout.write('********************************************************')
    }, 3100);
    return () => clearInterval(interval);
  }, 1000);

  customWsProvider._websocket.on("close", async (code: any) => {
    let count: number = 3;
    const interval = setInterval(() => {
      if (count === 0) return
      count--
      process.stdout.write(
        `Connection lost with code ${code}! Attempting reconnect in ${count}s...\r`
      );
    }, 1000)
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
    setTimeout(() => {
      process.stdout.clearLine(0)
    }, 3100);
    return () => {
      clearInterval(interval);
    };
  });
};

init();
//now we create the express server
const server = http.createServer(app);
// we launch the server
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});