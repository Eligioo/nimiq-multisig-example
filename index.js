const Nimiq = require("@nimiq/core")
const Nim = require("./Nimiq")
const fs = require("fs")

async function generateMultiSigAndSignTransaction() {
    try {
        //connect to network
        await Nim.connect()

        //generate 3 keypairs
        let KeyPairs = []
        for (let index = 0; index < 3; index++) {
            KeyPairs.push(Nimiq.KeyPair.generate())            
        }

        //get public keys from keypairs
        let PublicKeys = KeyPairs.map(e => e.publicKey)
        //3 stands for minimal amount of signatures a transaction needs to be valid
        const MultiSigWal1 = Nimiq.MultiSigWallet.fromPublicKeys(KeyPairs[0], 3, PublicKeys);
        const MultiSigWal2 = Nimiq.MultiSigWallet.fromPublicKeys(KeyPairs[1], 3, PublicKeys);
        const MultiSigWal3 = Nimiq.MultiSigWallet.fromPublicKeys(KeyPairs[2], 3, PublicKeys);

        const commitmentPair1 = MultiSigWal1.createCommitment();
        const commitmentPair2 = MultiSigWal2.createCommitment();
        const commitmentPair3 = MultiSigWal3.createCommitment();

        const combinedCommitment = Nimiq.Commitment.sum([commitmentPair1.commitment, commitmentPair2.commitment, commitmentPair3.commitment]);
        const combinedPublicKey = Nimiq.PublicKey.sum([KeyPairs[0].publicKey, KeyPairs[1].publicKey, KeyPairs[2].publicKey]);


        let tx = MultiSigWal1.createTransaction(Nimiq.Address.fromUserFriendlyAddress("NQ06 TL1V 3LDN K71D 8S71 AHFN YBFJ LSJY 278T"), Nimiq.Policy.coinsToSatoshis(1), 0, 235489);
        const partialSignature1 = MultiSigWal1.partiallySignTransaction(tx, PublicKeys,
            combinedCommitment, commitmentPair1.secret);
        const partialSignature2 = MultiSigWal2.partiallySignTransaction(tx, PublicKeys,
            combinedCommitment, commitmentPair2.secret);
        const partialSignature3 = MultiSigWal3.partiallySignTransaction(tx, PublicKeys,
            combinedCommitment, commitmentPair3.secret);

        //You can leave out partialSignature3 here for example and you will notice you don't have enough signatures
        let transaction = MultiSigWal1.completeTransaction(tx, combinedPublicKey, combinedCommitment,
            [partialSignature1, partialSignature2, partialSignature3]);
        let verify = transaction.verify()
        console.log("Transaction verified.", verify)

        //What has to go into the Safe Prepared Transaction????
        let serializedTx = JSON.stringify(transaction)
        let address = Nimiq.Address.fromHash(tx.sender)

        console.log(`A new MultiSigWallet has been created: ${address.toUserFriendlyAddress()}. You have 4 minutes to make sure this address has enough balance to send the transaction.`)
        //240000 is 4 minutes, gives you time to let the wallet have enough balance.
        setTimeout(() => {
            Nim.sendTranscation(transaction)
        }, 240000);

    } catch (error) {
        console.log(error) 
    }
}

generateMultiSigAndSignTransaction()