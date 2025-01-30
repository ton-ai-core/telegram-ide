contract Counter {
    val: Int as uint32;
    
    init() {
        self.1val = 0;  // Ошибка: некорректное имя переменной
    }
    
    receive("increment") {
        self.val = self.val + 1;
    }
    
    get fun value(): Int {
        return self.val;
    }
} 