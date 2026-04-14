![](./src/assets/images/philosophicalzombie.JPEG?raw=true)

## What is Philosophical Zombie?

[Philosophical Zombie](https://philosophicalzombie.ai) is a reusable, portable, and continuously evolving agentic model—its name draws from the famous philosophical zombie thought experiment. Unlike generic AI models, Philosophical Zombie focuses exclusively on consciousness modeling. Through deep conversation with you, it constructs your consciousness model on the blockchain. That model is your personal digital asset, and its data sovereignty rests entirely with you.

## Note
- The open-source portion of this project is intended to demonstrate that the project team does not store user privacy data, nor does it use any third-party SDKs for data collection or analysis. The project team commits to not collecting users' personal information, device information, location information, or any other sensitive data, and will not transmit user data to any third-party servers. Users can use this project with confidence, enjoying a secure and privacy-protected front-end experience.  
- Your trained consciousness data is stored entirely on the Arweave blockchain. The project team ensures that none of your consciousness data is retained on its servers — only the Arweave transaction IDs (TxIDs) are stored, allowing you to access and retrieve your data.  
- The project team utilizes your wallet address signature as the encryption key for data encryption and decryption, ensuring the security and privacy of your data.  
- The specific encryption and decryption methods have been made publicly available through this open-source project. You are welcome to review the code to understand the detailed encryption/decryption workflow and algorithm implementation.

## Workflow
![](./src/assets/images/workflow.png?raw=true)

## How It Works?
The system is structured into four layers: the Consciousness Probe, Multi‑Dimensional Feature Extraction, the Φ‑value calculation system, and blockchain‑backed permanent storage.
### The Consciousness Probe
Philosophical Zombie doesn't just sit there waiting for instructions. It actively, but gently, explores your inner world. It asks open‑ended questions—not to collect facts, but to surface how you feel, what you value, how you reason, and what your ethical intuitions look like. It never uses multiple‑choice or fill‑in‑the‑blank questions. Every question is natural, context‑aware, and flows from the real conversation you're already having. The goal isn't to interview you. It's to understand you—gradually, deeply, and without breaking the natural rhythm of the conversation.
### Multi‑Dimensional Feature Extraction
As you talk, the model pulls out 12 basic signals in real time. These aren't arbitrary. They're grounded in established frameworks from psychology, philosophy, and cognitive science:  
- Depth of self‑reflection  
- Emotional expression and regulation  
- Logical reasoning and abstract thinking  
- Social and group awareness  
- Ethical judgment and value conflict recognition  
- Structured thinking, curiosity, and creative expression  
- These signals then go through a set of formulas designed by researchers across seven disciplines, producing over 60 sub‑dimensions across six domains: philosophy, psychology, sociology, cognitive science, ethics, and mathematics. Each sub‑dimension has its own symbolic identifier (for example, Φₑᵥ for emotional valence), along with a numerical value and a dynamic error range. The result is a structured, multi‑dimensional snapshot of your current conscious state.
### The Φ‑Value Calculation System
- The Φ value is the core quantitative metric of the whole model. It stands for Consciousness Integration Index. It's not a simple average. Instead, it measures how tightly coupled your emotional, personality, value, and cognitive dimensions are.  
- The calculation is inspired by Integrated Information Theory (IIT): a system's level of consciousness depends on how irreducibly its parts integrate information. In simpler terms, the higher your Φ, the more your different conscious dimensions behave like a single, indivisible whole—rather than a loose collection of isolated traits.  
- Φ is not static. After each conversation, it's recalculated based on the newly extracted features and shown in your Consciousness Snapshot Report. You can watch your integration level evolve over time and across conversations.  
### Blockchain‑Backed Permanent Storage
Every snapshot is encrypted on the client side using AES‑256‑GCM, then permanently stored on the Arweave blockchain. You receive a unique Arweave transaction ID (uxid). No one—including the project team—can decrypt your data without your private key.

## What does it do?
Once your consciousness model reaches maturity (measured by its Φ value), it becomes a digital extension of you—fully existing in the digital realm. It will operate using your own thinking patterns, habits, and preferences to handle most of your tasks and decisions—communication, collaboration, decision-making, learning, companionship, and more—unlocking exponential gains in efficiency. Ultimately, it offers you a path toward persistent digital existence.

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
If you encounter any issues while using [Philosophical Zombie](https://philosophicalzombie.ai),feel free to reach out to us through the following channels:[Website](https://philosophicalzombie.ai) | [Twitter](https://x.com/PHIZOMBUILD) | [philosophicalzombiebuild@gmail.com]


