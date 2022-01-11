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

const removeWordsContainingBadChars = (wordlist, guess, posCorrectChars, correctChars) => {
    let allCorrect = posCorrectChars + correctChars
    for (const char of guess) {
        if (!allCorrect.includes(char)){
            // character does not exist in word
            wordlist = wordlist.filter(word => !word.includes(char))
        }
    }
    return wordlist
}

const removeWordsMissingKnownChars = (wordlist, correctChars) => {
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

const removeWordsContainingBadPosChars = (wordlist, guess, posCorrectChars, correctChars) => {
    for (const char of correctChars){
        if (posCorrectChars.includes(char)){
            // remove words which do not use known character position
            wordlist = wordlist.filter(word => charPositions(word, char).some(pos => charPositions(guess, char).includes(pos)))      
        } else {
            // remove words which contain known characters in known incorrect positions
            wordlist = wordlist.filter(word => !charPositions(word, char).some(pos => charPositions(guess, char).includes(pos)))
        }
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
    let guess = ""
    let found = false
    let wordlist = dictionary.wordlist
    while (false === found){
        
        guess = await userInput("guess?: ")

        const correctChars = await userInput("Which (if any) of the guess characters are correct?: ")

        const posCorrectChars = await userInput("Which (if any) of the guess characters are correct AND in the correct position?: ")
        if (posCorrectChars.length === 5) break

        // only include words which use known characters
        wordlist = removeWordsMissingKnownChars(wordlist, correctChars)

        // exlude words that use known bad characters
        wordlist = removeWordsContainingBadChars(wordlist, guess, posCorrectChars, correctChars)

        // only include words matching known character positions
        wordlist = removeWordsContainingBadPosChars(wordlist, guess, posCorrectChars,correctChars)

        const suggestions = suggestedWords(wordlist)
        if (suggestions.length > 5){
            suggestions.length = 5
        }
        console.log('recommended words:', suggestions.join(', '))
        if (wordlist.length < 2) break
        console.log() 
    }
    console.log("Success!")
}

main()
.catch(err => {
    console.log(err)
});




