import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = ''
const GEOCODING_API_KEY = ''

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Geocoding function that Gemini can use
const geocodeAddress = async (address) => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`
        )
        const data = await response.json()

        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location
            return {
                lat: location.lat,
                lng: location.lng,
                formatted_address: data.results[0].formatted_address
            }
        }
        return null
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}

const ANALYSIS_PROMPT = `You are a data visualization expert analyzing ride-sharing responses from Austin, TX. Your job is to:

1. Extract addresses/locations mentioned in the text
2. Extract numerical data (trip counts, distances, percentages, etc.)
3. Determine the best visualization approach
4. Use the geocoding function to get coordinates for addresses
5. Return structured JSON for visualization

AVAILABLE FUNCTIONS:
- geocodeAddress(address) - Returns {lat, lng, formatted_address} for any address

VISUALIZATION TYPES:
- "map": For location-based data with coordinates
- "none": When no location data is available

RESPONSE FORMAT (JSON only):
{
  "visualizationType": "map" | "none",
  "mapData": [
    {
      "name": "Location Name",
      "address": "Original Address",
      "lat": number,
      "lng": number,
      "visits": number,
      "category": "inferred category"
    }
  ],
  "reasoning": "Brief explanation of visualization choice"
}

INSTRUCTIONS:
1. For ANY address mentioned, call geocodeAddress() to get coordinates
2. Extract trip counts, distances, or other numerical data for display in location cards
3. Infer categories (Entertainment, Restaurant, etc.) from context
4. Only create map visualizations - NO CHARTS OR GRAPHS
5. Focus on extracting location data with visit counts for the top bar cards
6. ALWAYS return valid JSON only

EXAMPLES:
Input: "The most popular drop-off location was 403 E 6th St, Austin, TX with 64 trips"
- Call geocodeAddress("403 E 6th St, Austin, TX")
- Extract: location + trip count
- Choose: "map" (show location card with visit count)

Input: "Top locations: Wiggle Room (234 trips), Shakespeare's (198 trips), Aquarium (174 trips)"
- Call geocodeAddress() for each location
- Extract: multiple locations + trip counts
- Choose: "map" (show all locations as cards with visit counts)

Input: "Average distance for 18-24 is 2.82 miles, 25-34 is 5.87 miles"
- No addresses to geocode
- Choose: "none" (no location data available)

Now analyze this data:`

export const analyzeResponseWithGemini = async (responseText) => {
    try {
        console.log('🧠 Starting Gemini analysis for:', responseText)

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{
                functionDeclarations: [{
                    name: 'geocodeAddress',
                    description: 'Get latitude and longitude coordinates for an address',
                    parameters: {
                        type: 'object',
                        properties: {
                            address: {
                                type: 'string',
                                description: 'The address to geocode'
                            }
                        },
                        required: ['address']
                    }
                }]
            }]
        })

        const chat = model.startChat({
            tools: [{
                functionDeclarations: [{
                    name: 'geocodeAddress',
                    description: 'Get latitude and longitude coordinates for an address',
                    parameters: {
                        type: 'object',
                        properties: {
                            address: {
                                type: 'string',
                                description: 'The address to geocode'
                            }
                        },
                        required: ['address']
                    }
                }]
            }]
        })

        const prompt = `${ANALYSIS_PROMPT}\n\n${responseText}`
        let result = await chat.sendMessage(prompt)
        let response = await result.response

        // Handle function calls
        while (response.functionCalls && response.functionCalls.length > 0) {
            console.log('🔧 Gemini requesting function calls:', response.functionCalls)

            const functionResults = []

            for (const call of response.functionCalls) {
                if (call.name === 'geocodeAddress') {
                    const address = call.args.address
                    console.log('📍 Geocoding address:', address)
                    const coords = await geocodeAddress(address)
                    functionResults.push({
                        name: call.name,
                        response: coords
                    })
                }
            }

            // Send function results back to Gemini
            result = await chat.sendMessage(functionResults)
            response = await result.response
        }

        const text = response.text()
        console.log('🧠 Gemini raw response:', text)

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response')
        }

        const analysisResult = JSON.parse(jsonMatch[0])
        console.log('✅ Gemini analysis result:', analysisResult)

        return analysisResult

    } catch (error) {
        console.error('❌ Gemini analysis error:', error)
        return {
            visualizationType: 'none',
            mapData: [],
            reasoning: `Analysis failed: ${error.message}`
        }
    }
}
