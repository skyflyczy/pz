![](./src/assets/images/philosophicalzombie.JPEG?raw=true)

## What is Philosophical Zombie?

[Philosophical Zombie](https://philosophicalzombie.ai) is a reusable, portable, and continuously evolving agentic model—its name draws from the famous philosophical zombie thought experiment. Unlike generic AI models, Philosophical Zombie focuses exclusively on consciousness modeling. Through deep conversation with you, it constructs your consciousness model on the blockchain. That model is your personal digital asset, and its data sovereignty rests entirely with you.

## Note
1. The open-source portion of this project is intended to demonstrate that the project team does not store user privacy data, nor does it use any third-party SDKs for data collection or analysis. The project team commits to not collecting users' personal information, device information, location information, or any other sensitive data, and will not transmit user data to any third-party servers. Users can use this project with confidence, enjoying a secure and privacy-protected front-end experience.  
2. Your trained consciousness data is stored entirely on the Arweave blockchain. The project team ensures that none of your consciousness data is retained on its servers — only the Arweave transaction IDs (TxIDs) are stored, allowing you to access and retrieve your data.  
3. The project team utilizes your wallet address signature as the encryption key for data encryption and decryption, ensuring the security and privacy of your data.  
4. The specific encryption and decryption methods have been made publicly available through this open-source project. You are welcome to review the code to understand the detailed encryption/decryption workflow and algorithm implementation.

## Workflow
![](./src/assets/images/workflow.jpg?raw=true)


## 工作原理


## Code Examples
```js
/**
 * Handle the submission of consciousness data to the blockchain.
 */
const handleSubmit = async (): Promise<void> => {
    //...
    try {
        // Step 1: Data Encryption
        const messages = messageListRef.value
            .filter((msg) => msg.isWaitOnChain)
            .map((msg) => ({
                type: msg.messageType,
                content: msg.messageContent,
                flag: msg.flag,
                author: msg.author,
                time: msg.time,
            }));

        const dataToEncrypt = JSON.stringify(messages);
        const encryptedData = await walletStore.encryptData(dataToEncrypt);
        //...

        // Step 2: Submit to the blockchain
        const uploadRes = await walletStore.uploadFile(encryptedData) as UploadResult;
        //...

        // Step 3: Chain completed, save TxId and update UI
        await saveTx({
            address: walletStore.walletData?.address,
            arTxId: uploadRes.id,
            modelResult: messageListRef.value[messageListRef.value.length - 1].modelResult,
            gas: uploadRes.winc,
            uploadSize: uploadRes.uploadSize,
            createTime: formatTime(Date.now(), "YYYY-MM-dd HH:mm:ss")
        }).then(() => {
            // Clear local cache
            chatStore.clearChatLocalCache();
        });
        
    } catch (error) {
       //...
    } finally {
        //...
    }
};
```

```js
/**
 * Fetch historical messages based on the provided page number.
 * This function retrieves messages from the blockchain using the TxId list and updates the message list accordingly.
 * It also manages the loading state and handles pagination for fetching more historical messages.
 * @param {number} page - The page number to fetch, starting from 1.
 */
 
const fetchHistoryByPage = async (page: number): Promise<void> => {
    //... 

    try {
        const txId = txidListRef.value[page - 1];
        const data = await walletStore.getHistoryByTxid(txId);
        //... Decrypt the data and update the message list
    } catch (error) {
        //...
    } finally {
       //...
    }
};
```
```js
/**
 * Fetch historical messages based on the provided TxId and AES key.
 * This function retrieves encrypted data from multiple gateways using the TxId, decrypts it using the AES key, and returns the parsed message history.
 * @param {string} txId - The transaction ID to fetch data from.
 * @param {string} aesKey - The AES key used for decryption.
 * @returns {Promise<any[]>} - A promise that resolves to an array of historical messages.
 */
export async function getHistoryByTxid(
    txId: string,
    aesKey: string,
): Promise<any[]> {
   //...

    const gateways = [
        { name: "Arweave Gateway", url: `https://arweave.net/${txId}` },
        { name: "ArDrive Gateway", url: `https://ardrive.net/${txId}` },
        { name: "Turbo Gateway", url: `https://turbo-gateway.com/${txId}` },
    ];

    let encryptedDataFromChain = "";
    for (const gw of gateways) {
        try {
            const res = await fetch(gw.url);
            if (!res.ok) continue;

            const text = await res.text();
            if (text) {
                encryptedDataFromChain = text;
                break;
            }
        } catch (_) {
            // Try next gateway
            continue;
        }
    }
    //...
}
```

## Support
如果你在使用[Philosophical Zombie](https://philosophicalzombie.ai)过程中遇到任何问题，欢迎通过以下方式联系我们:[Website](https://philosophicalzombie.ai) | [Twitter](https://x.com/PHIZOMBUILD) | [philosophicalzombiebuild@gmail.com]


