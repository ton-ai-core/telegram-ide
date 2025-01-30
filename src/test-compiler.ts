import { compileTactCode } from './bot';
import * as fs from 'fs/promises';

async function main() {
    try {
        // Читаем контракт из файла
        const source = await fs.readFile('temp_contract.tact', 'utf8');
        console.log('Тестируем компиляцию контракта...');
        console.log('Исходный код:\n', source);

        // Компилируем контракт
        try {
            const output = await compileTactCode(source);
            console.log('✅ ' + output);
        } catch (error: any) {
            // Извлекаем информацию об ошибке
            const errorMessage = error.message || '';
            
            // Ищем детали ошибки в формате "Line X, col Y:"
            const match = errorMessage.match(/Line (\d+), col (\d+):\n([\s\S]*?)\n\n/);
            
            if (match) {
                const [, line, col, context] = match;
                console.error('❌ ' + `Ошибка компиляции в строке ${line}, позиция ${col}:\n${context}\nПроверьте синтаксис контракта.`);
            } else {
                console.error('❌ ' + `Ошибка компиляции: ${errorMessage}\nПроверьте синтаксис контракта.`);
            }
        }
    } catch (error: any) {
        console.error('Ошибка чтения файла:', error.message);
    }
}

main(); 