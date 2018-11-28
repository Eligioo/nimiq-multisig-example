const Nimiq = require('@nimiq/core')

let $ = {}

const NIMIQ_NETWORK = "test"

module.exports = {
    async connect() {
        $.established = false;
        Nimiq.GenesisConfig[NIMIQ_NETWORK].call(this)

        console.log(`Connecting to Nimiq Network: ${NIMIQ_NETWORK}.`)
        //Has to be light, nano will get rejected by mempool
        $.consensus = await Nimiq.Consensus.light()
        
        $.blockchain = $.consensus.blockchain
        $.mempool = $.consensus.mempool
        $.network = $.consensus.network

        $.consensus.on('established', () => {
            $.established = true
        })
        $.consensus.on('lost', () => {
            $.established = false
        });
        
        $.network.connect();
    },

    async sendTranscation(tx) {
        console.log("Send Transaction")

        $.mempool.on('transaction-added', async tx2 => {
            if(tx.equals(tx2)) {
                console.log(`Tx added ${tx.hash().toHex()}`)
            }
        })

        const ret = await $.mempool.pushTransaction(tx);
        if (ret < 0) {
            console.log("Erroro")
            const e = new Error(`Transaction not accepted: ${ret}`);
            e.code = ret;
            throw e;
        }
    }
}