const readline = require('readline')
const dictionary = require("./dictionary")

const userInput = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise(resolve => rl.question(query, ans => {
        rl.close()
        resolve(ans || "")
    }))
}

const removeWordsContainingBadChars = (wordlist, guess, greenChars, yellowChars) => {
    let correctChars = greenChars + yellowChars
    for (const char of guess) {
        if (!correctChars.includes(char)){
            // character does not exist in word
            wordlist = wordlist.filter(word => !word.includes(char))
        }
    }
    return wordlist
}

const removeWordsMissingKnownChars = (wordlist, greenChars, yellowChars) => {
    let correctChars = greenChars + yellowChars
    for (const char of correctChars){
        wordlist = wordlist.filter(word => word.includes(char))
    }
    return wordlist
}

const charPositions = (str, char) => {
    const tmp = [...str]
    char = char.toLowerCase()
    return tmp.reduce((res, elem, idx) => elem.toLowerCase() === char ? [...res, idx] : res, [])
}

const removeWordsContainingBadPosChars = (wordlist, guess, greenChars, yellowChars) => {
    // remove words which do not use known character position
    for (const char of greenChars){
        wordlist = wordlist.filter(word => charPositions(word, char).some(pos => charPositions(guess, char).includes(pos))) 
    }
    
    // remove words which contain known characters in known incorrect positions
    for (const char of yellowChars){
        wordlist = wordlist.filter(word => !charPositions(word, char).some(pos => charPositions(guess, char).includes(pos)))
    }

    return wordlist
}

const suggestedWords = (wordlist) => {
    const suggested = {}
    const counts = {}
    for (const word of wordlist){
        const chars = {}
        for (const char of word){
            if (chars[char] !== undefined){
                continue
            }
            chars[char]=1
            counts[char] = (counts?.[char] ?? 0) + 1
        }
    }

    for (const word of wordlist){
        for (const [char, count] of (Object.entries(counts).sort(([,a],[,b]) => a-b).reverse())){
            if (word.includes(char)){
                suggested[word] = ( suggested?.[word] ?? 0) + 1
            }
        }
    }

    const res = Object.entries(suggested).sort(([,a],[,b]) => a-b).reverse()
    return res
}

async function main(){
    let wordlist = dictionary.wordlist
    let status = ""
    while (status === ""){
        
        let guess = await userInput("guess?: ")

        const yellowChars = await userInput("Which (if any) of the guess characters are yellow?: ")

        const greenChars = await userInput("Which (if any) of the guess characters are green?: ")
        if (greenChars.length === 5){
            status = "Success!"
            continue
        }

        // only include words which use known characters
        wordlist = removeWordsMissingKnownChars(wordlist, greenChars, yellowChars)

        // exlude words that use known bad characters
        wordlist = removeWordsContainingBadChars(wordlist, guess, greenChars, yellowChars)

        // only include words matching known character positions
        wordlist = removeWordsContainingBadPosChars(wordlist, guess, greenChars, yellowChars)

        const suggestions = suggestedWords(wordlist)
        if (suggestions.length > 5){
            suggestions.length = 5
        }
        console.log('recommended words:', suggestions.join(', '))
        if (wordlist.length == 1) {
            status = "Success!"
        }
        if (wordlist.length == 0) {
            status = "No matching word in dictionary or typo in previous answer!"
        }
        console.log() 
    }
    console.log(status)
}

main()
.catch(err => {
    console.log(err)
});




