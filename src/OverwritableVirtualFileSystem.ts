import { VirtualFileSystem } from '@tact-lang/compiler';
import * as path from 'path';

export class OverwritableVirtualFileSystem implements VirtualFileSystem {
    public overwrites: Map<string, Buffer>;
    public root: string;

    constructor(root: string) {
        this.root = root;
        this.overwrites = new Map();
    }

    exists(path: string): boolean {
        return this.overwrites.has(this.normalizePath(path));
    }

    readFile(path: string): Buffer {
        const normalizedPath = this.normalizePath(path);
        const content = this.overwrites.get(normalizedPath);
        if (!content) {
            throw new Error(`File ${path} not found`);
        }
        return content;
    }

    writeFile(path: string, content: Buffer): void {
        const normalizedPath = this.normalizePath(path);
        this.overwrites.set(normalizedPath, content);
    }

    writeContractFile(path: string, content: string | Buffer): void {
        const normalizedPath = this.normalizePath(path);
        this.overwrites.set(
            normalizedPath,
            Buffer.isBuffer(content) ? content : Buffer.from(content)
        );
    }

    resolve(from: string | undefined, to: string | undefined): string {
        // Если to не определен, возвращаем from или корневой путь
        if (!to) {
            return from || this.root;
        }

        // Если путь абсолютный или начинается с @, возвращаем его как есть
        if (to.startsWith('/') || to.startsWith('@')) {
            return to;
        }

        // Если from не определен, используем корневой путь
        if (!from) {
            return path.join(this.root, to);
        }

        // Иначе разрешаем относительный путь
        const fromDir = path.dirname(from);
        return path.join(fromDir, to);
    }

    private normalizePath(path: string): string {
        // Если путь начинается с @, возвращаем его как есть
        if (path.startsWith('@')) {
            return path;
        }
        // Убираем начальный слеш, если он есть
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        // Добавляем корневой путь
        return this.root + path;
    }
} 