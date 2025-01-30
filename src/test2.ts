import { compileTactCode } from './bot';

const CONTRACT_SOURCE = `
contract Counter {
    val: Int as uint32;
    
    init() {
        self.val = 0;  // Fixed: correct variable name
    }
    
    receive("increment") {
        self.val = self.val + 1;
    }
    
    get fun value(): Int {
        return self.val;
    }
}
`;

async function main() {
    try {
        console.log('Testing contract compilation...');
        console.log('Source code:\n', CONTRACT_SOURCE);

        const output = await compileTactCode(CONTRACT_SOURCE);
        console.log('✅ ' + output);
    } catch (error: any) {
        // Extract error information
        const errorMessage = error.message || '';
        
        // Look for error details in "Line X, col Y:" format
        const match = errorMessage.match(/Line (\d+), col (\d+):\n([\s\S]*?)\n\n/);
        
        if (match) {
            const [, line, col, context] = match;
            console.error('❌ ' + `Compilation error at line ${line}, position ${col}:\n${context}\nPlease check your contract syntax.`);
        } else {
            console.error('❌ ' + `Compilation error: ${errorMessage}\nPlease check your contract syntax.`);
        }
    }
}

main(); 