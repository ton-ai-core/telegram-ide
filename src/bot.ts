import { build } from '@tact-lang/compiler';
import { createVirtualFileSystem } from '@tact-lang/compiler';
import stdLibFiles from '@tact-lang/compiler/dist/imports/stdlib';
import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';

export async function compileTactCode(source: string): Promise<string> {
    try {
        // Create virtual file system for the project
        const vfs = new OverwritableVirtualFileSystem('/');
        vfs.writeContractFile('contract.tact', source);

        // Create virtual file system for standard library
        const stdlib = createVirtualFileSystem('@stdlib/', stdLibFiles);

        // Compile the contract
        const result = await build({
            project: vfs,
            stdlib: stdlib,
            config: {
                path: '/contract.tact',
                name: 'Counter',
                output: '/output',
                options: { debug: true }
            }
        });

        // Check compilation result
        if (!result || !result.ok || result.error.length > 0) {
            throw new Error(result?.error[0]?.message || 'Unknown compilation error');
        }

        // If we reached this point, compilation was successful
        return 'No errors found. Contract compiled successfully.';
    } catch (error: any) {
        // Pass the error up for handling in index.ts
        throw error;
    }
} 