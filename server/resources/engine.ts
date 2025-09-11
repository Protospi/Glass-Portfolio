import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from "dotenv";
import OpenAI from 'openai';
dotenv.config({ path: '../../.env' });

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_AGENT_LOOP = 3

export class engine  {

    // Define run function
    async run(userInput: string, input: any[]) {
        console.log('🚀 Starting AI Engine...')
        console.log('📝 User Input:', userInput)
        console.log('📦 Initial Input Array Length:', input.length)

        // Define raw variables
        const rawPrompt = readFileSync('./system-prompt.txt', 'utf-8')
        const toolsJson = readFileSync('./tools.json', 'utf-8')
        const tools = JSON.parse(toolsJson)
        
        let loopAgent = true
        let loopCounter = 0

        // Run the agent
        console.log('🔄 Starting agent loop...')
        while (loopAgent && loopCounter < MAX_AGENT_LOOP) {

            // Increment the loop counter
            loopCounter++
            console.log(`\n🔄 Agent Loop Iteration: ${loopCounter}/${MAX_AGENT_LOOP}`)
    
            // Replace variables in the prompt
            const dateTimeInfo = this.getSaoPauloTodayInfo()
            
            // Replace variables in the prompt
            const finalPrompt = this.replaceVariable(
            rawPrompt,
            '$dateTime',
            dateTimeInfo
            )

            // Define input messages
            if (input.length === 0) {
                input = [
                    { role: "system", content: finalPrompt },
                    { role: "user", content: userInput }
                    ]
            } else {
                input.push({ role: "user", content: userInput })
            }
    
            // Generate AI response
            let response = await openai.responses.create({
                model: "gpt-5",
                tools,
                input: input,
              });
              
            console.log('📤 Response outputs count:', response.output)
    
            // For responses.create API, we need to add function calls to input array
            const functionCalls = response.output.filter(output => output.type === 'function_call')
            
            if (functionCalls.length > 0) {
                // Add function calls to input array using the format expected by responses.create
                for (const fc of functionCalls) {
                    input.push({
                        type: "function_call",
                        call_id: fc.call_id,
                        name: fc.name,
                        arguments: fc.arguments
                    })
                }
            }

            // Handle the agent output
            for (const output of response.output) {

                // Handle the message and function call output
                if (output.type === 'message') {

                    // Handle the message content
                    for (const content of output.content) {
                        console.log('📝 Processing content type:', content.type)

                        // Handle the output text
                        if (content.type === 'output_text') {
                            console.log('📄 Assistant response:', content.text.substring(0, 100) + (content.text.length > 100 ? '...' : ''))
                            loopAgent = false
                            input.push({ role: "assistant", content: content.text })
                        }
                    }

                // Handle the function call output
                } else if (output.type === 'reasoning') {

                    console.log('📝 Processing reasoning output:', output)
                
                    // Push reasoning output to input array
                    // input.push({ role: "assistant", content: output })
                
                
                } else if (output.type === 'function_call') {
                    console.log('🎯 Function name:', output.name)
                    console.log('📦 Function arguments:', output.arguments)

                    // Parse the function call arguments and define variables
                    const args = JSON.parse(output.arguments)
                    let toolResult = ''
        
                    // Switch case to handle the function call
                    switch (output.name) {

                    // Handle the get_portfolio_info tool
                    case 'get_portfolio_info':
                        console.log('📊 Getting portfolio info for:', args.portfolio)
                        // Run the script
                        toolResult = await this.getPortfolioInfo(args.portfolio)
                        console.log('✅ Portfolio info result:', toolResult)
                        break
        
        
                    // Handle the default case
                    default:
                        console.log('❌ UNHANDLED TOOL:', output.name)
                        toolResult = `ERROR: tool ${output.name} not implemented.`
                        break
                    }
        
                    // Push tool result using the correct format for responses.create API
                    input.push({
                        type: "function_call_output",
                        call_id: output.call_id,
                        output: toolResult
                    })
                } else {
                    console.log('❓ Unhandled openAI output type:', output.type, output)
                    loopAgent = false
                }
            }
            
        }
        
        console.log('📊 Final input array:', input)
        
        // Return the input array
        return input
            
    }

    // Define private são paulo date and time function
    private getSaoPauloTodayInfo() {

        // Define raw variables
        const date = new Date()
        const locale = 'pt-BR'
        const timeZone = 'America/Sao_Paulo'

        // Define date and time variables
        const weekDay = date.toLocaleDateString(locale, { weekday: 'long', timeZone })
        const day = date.toLocaleDateString(locale, { day: 'numeric', timeZone })
        const month = date.toLocaleDateString(locale, { month: 'long', timeZone })
        const year = date.toLocaleDateString(locale, { year: 'numeric', timeZone })
        const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone })

        // Define result string
        const result = `Hoje é ${weekDay}, dia ${day} de ${month} de ${year}, horário atual: ${time}, aqui em São Paulo.`
        return result
    }

    // Define private replace variable function
    private replaceVariable(text: string, variable: string, dynamicValue: string) {

        // Replace variable in text
        const result = text.replace(
            new RegExp(`\\$${variable}`, 'g'),
            () => dynamicValue || ''
        )

        // Return result
        return result
    }

    // Define private get portfolio info function
    private async getPortfolioInfo(portfolio: string) {

        // Define result string
        const result = `Portfolio: ${portfolio}`

        // Return result
        return result
    }
  
}

// Main function to make the engine executable
async function main() {
    
    try {
        // Create engine instance
        const engineInstance = new engine()
        
        // Test input
        const testUserInput = "Hello, can you get information about project 1?"
        const testInputArray: any[] = []
        
        console.log('🧪 Running test with input:', testUserInput)
        
        // Run the engine
        const result = await engineInstance.run(testUserInput, testInputArray)
        
        console.log('📋 Final result array length:', result?.length || 0)
        
        if (result && result.length > 0) {
            console.log('📄 Final conversation:')
            result.forEach((msg, index) => {
                console.log(`  ${index + 1}. [${msg.role || msg.type}]:`, 
                    typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : 
                    typeof msg.output === 'string' ? msg.output.substring(0, 100) + '...' : 
                    JSON.stringify(msg).substring(0, 100) + '...')
            })
        }
        
    } catch (error) {
        console.error('❌ Error running engine test:', error)
        process.exit(1)
    }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error)
}
