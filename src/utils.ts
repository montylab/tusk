export const getRandomCategory = (): string => {
    const categories: string[] = ['Work', 'Personal', 'Urgent', 'Learning'];
    return categories[Math.floor(Math.random() * categories.length)];
}
