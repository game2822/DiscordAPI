import dotenv from 'dotenv';
import * as readline from 'readline';
import { SendMessageInChannel, GetMessagesForChannel, DeleteMessageInChannel, EditMessageInChannel } from '../src/routes/Messages';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log('\n=== Discord API Message Tester ===\n');
    console.log('Available functions:');
    console.log('1. Send Message');
    console.log('2. Get Messages');
    console.log('3. Delete Message');
    console.log('4. Edit Message')
    console.log('5. Automated Test Suite\n');

    const choice = await question('Select a function (1-5): ');

    switch (choice) {
        case '1':
            await testSendMessage();
            break;
        case '2':
            await testGetMessages();
            break;
        case '3':
            await testDeleteMessage();
            break;
        case '4':
            await testEditMessage();
            break;
        case '5':
            console.log('\nRunning Automated Test Suite...\n');
            await AutomatedTests();
            console.log('\nAutomated Test Suite Completed.\n');
            break;
        default:
            console.log('Invalid choice!');
            break;
    }

    rl.close();
}

async function testSendMessage(ChannelId?: string, Content?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');
    const content = Content ?? await question('Enter message content: ');

    try {
        const result = await SendMessageInChannel(channelId, content, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Message sent successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('\n✗ Error sending message:', error);
    }
}

async function testDeleteMessage(ChannelId?: string, MessageId?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');
    const messageId = MessageId ?? await question('Enter message ID: ');

    try {
        await DeleteMessageInChannel(channelId, messageId, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Message deleted successfully!');
    } catch (error) {
        console.error('\n✗ Error deleting message:', error);
    }

}

async function testGetMessages(ChannelId?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');

    try {
        const messages = await GetMessagesForChannel(channelId, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Messages retrieved successfully!');
        console.log(`Found ${messages.length} messages:`);
        console.log(JSON.stringify(messages, null, 2));
    } catch (error) {
        console.error('\n✗ Error getting messages:', error);
    }
}

async function testEditMessage(ChannelId?: string, MessageId?: string, NewContent?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');
    const messageId = MessageId ?? await question('Enter message ID: ');
    const newContent = NewContent ?? await question('Enter new message content: ');
    try {
        // Assuming EditMessageInChannel is implemented similarly to SendMessageInChannel
        const result = await EditMessageInChannel(channelId, messageId, newContent, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Message edited successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n✗ Error editing message:', error);
    }
}

async function AutomatedTests() {
    console.log('\nRunning Automated Test Suite...\n');
    const ChannelId: string = "1446808721832411197";
    
    for (let i = 1; i <= 5; i++) {
        console.log(`\n=== Test Iteration ${i}/5 ===\n`);
        let MessageId: string = "";
        
        try {
            const result = await testSendMessage(ChannelId, `Automated Test Message ${i}`);
            MessageId = result.id;
        } catch (e) {
            console.error('Error in Send Message Test:', e);
        }
        console.log('-----------------------------------');
        
        try {
            await testGetMessages(ChannelId);
        } catch (e) {
            console.error('Error in Get Messages Test:', e);
        }
        console.log('-----------------------------------');
        
        try {
            await testEditMessage(ChannelId, MessageId, `Edited Automated Test Message ${i}`);
        } catch (e) {
            console.error('Error in Edit Message Test:', e);
        }
        console.log('-----------------------------------');
        
        try {
            await testDeleteMessage(ChannelId, MessageId);
        } catch (e) {
            console.error('Error in Delete Message Test:', e);
        }
        console.log('-----------------------------------');
    }
    
    console.log('\nAutomated Test Suite Completed.\n');
    console.log('-----------------------------------');
}

main();