import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { stepCountIs, streamText } from 'ai';
import { SYSTEM_PROMPT } from './prompt'
import { getFileChangesInDirectoryTool, getGitCommitMessageTool } from './tools';

const codeReviewAgent = async (prompt: string) => {
    const result = streamText({
        model: google("models/gemini-2.5-flash"),
        prompt,
        system: SYSTEM_PROMPT,
        tools: {
            getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
            getGitCommitMessageTool: getGitCommitMessageTool,
        },
        stopWhen: stepCountIs(10),
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
}

await codeReviewAgent(
    `Review the code changes in '../my-agent' directory, make your reviews and suggestions file by file.
     Then, generate a git commit message for the changes.`,
)
// const { text } = await generateText({
//     model: google("models/gemini-2.5-flash"),
//     prompt: "What is an AI agent?"
// });

// console.log(text);
