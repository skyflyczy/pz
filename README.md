![](./src/assets/images/philosophicalzombie.JPEG?raw=true)

## What is Philosophical Zombie?

Philosophical Zombie is XXX

## NOTE
1、此项目开源部分旨在标明项目方不保存户隐私数据，且不使用任何第三方 SDK 进行数据收集和分析。项目方承诺不收集用户的个人信息、设备信息、位置信息等敏感数据，并且不将用户数据发送到任何第三方服务器。用户可以放心使用该项目，享受安全、隐私保护的前端体验。  
2、您的训练的意识数据完全存储在Arweave链，项目方确保不保存任何您的意识数据，只保存Arweave链的TxID，供您使用与获取。  
3、项目方利用您的钱包地址签名作为密钥进行加解密，确保您的数据安全和隐私。  
4、具体的加解密方法通过此开源项目已经公开，您可以查看代码了解详细的加解密流程和算法实现。  

## WORKFLOW
![](./src/assets/images/mermaid-diagram.svg?raw=true)


## CODE EXAMPLES
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


