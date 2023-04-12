const ethers = require('ethers')

export default function calculate_gas_price(action: 'buy' | 'sell', amount: any) {
    if (action === "buy") {
        return ethers.utils.formatUnits(amount.add(2), 'wei')
    } else {
        return ethers.utils.formatUnits(amount.sub(2), 'wei')
    }
}