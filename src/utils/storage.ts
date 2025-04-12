// Save data to localStorage
export function saveToLocalStorage(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`Data saved: ${key} =`, value);
}

// Retrieve data from localStorage
export function getFromLocalStorage(key: string): any {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

// Remove data from localStorage
export function removeFromLocalStorage(key: string) {
    localStorage.removeItem(key);
    console.log(`Data removed: ${key}`);
}
