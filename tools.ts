import fs from 'fs'
import { tool } from 'ai';
import { simpleGit } from 'simple-git';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google'
import { z } from 'zod';
import { stdout } from 'bun';

const fileChange = z.object({
    rootDir: z.string().min(1).describe("The root directory"),
});

type FileChange = z.infer<typeof fileChange>;

const excludeFiles = ["dist", "bun.lock"];

async function getFileChangesInDirectory({ rootDir }: FileChange) {
    const git = simpleGit(rootDir);
    const summary = await git.diffSummary();
    const diffs: { file: string; diff: string}[] = [];

    for (const file of summary.files) {
        if (excludeFiles.includes(file.file)) continue;
        const diff = await git .diff(["--", file.file]);
        diffs.push({ file: file.file, diff})
    }

    return diffs;
}

export const getFileChangesInDirectoryTool = tool({
    description: "Gets the code changes made in given directory",
    inputSchema: fileChange,
    execute: getFileChangesInDirectory,
})


export const  getGitCommitMessageTool = tool({
    description: "Gets the git commit message for the code changes",
    inputSchema: z.object({
        diffs: z.array(z.object({
            file: z.string().min(1),
            diff: z.string().min(1),
        })),
    }),
    execute: async ({ diffs }) => {
        const { text } = await generateText({
            model: google("models/gemini-2.5-flash"),
            prompt: `Based on this changes generate a git commit message: ${diffs.map((d) => `${d.file}: ${d.diff}`).join("\n")}`,
        });
        stdout.write(`Generated commit message: ${text}\n`);
        return text;
    }
})

export const writeMarkdownFileTool = tool({
    description: "Writes the markdown file content",
    inputSchema: z.object({
        content: z.string().min(1),
    }),
    execute: async ({  content }) => {
        fs.writeFileSync('README.md', content);
        stdout.write(`Generated README.md\n`);
        return 'README.md';
    }
})
