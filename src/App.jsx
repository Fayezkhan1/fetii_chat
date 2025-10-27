import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import RideMap from './components/RideMap'
import SimpleChatInterface from './components/SimpleChatInterface'

import { analyzeResponseWithGemini } from './services/geminiAnalysisService'
import './index.css'

function App() {
  const [mapLocations, setMapLocations] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedMarkerId, setSelectedMarkerId] = useState(null)

  const handleMarkerClick = (markerId) => {
    setSelectedMarkerId(markerId)
  }



  // Handle bot messages from webhook responses
  const handleBotMessage = async (message) => {
    setIsAnalyzing(true)

    try {
      // Send to Gemini for analysis
      const analysis = await analyzeResponseWithGemini(message)

      // Update map locations based on analysis
      if (analysis.visualizationType === 'map') {
        if (analysis.mapData && analysis.mapData.length > 0) {
          // Clear old markers and set new ones
          setMapLocations(analysis.mapData)
          // Reset selection to first marker
          setSelectedMarkerId(0)
        }
      } else {
        // Clear map markers if no location data
        setMapLocations([])
        setSelectedMarkerId(null)
      }

    } catch (error) {
      console.error('Error analyzing bot message:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app">
      <div className="main-content" style={{ height: '100vh' }}>


        <div className="map-container" style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative',
          marginLeft: '400px' // Make space for left-positioned chat
        }}>
          {/* Bottom Location Cards */}
          {mapLocations.length > 0 && (
            <div 
              className="bottom-cards-container"
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                overflowY: 'hidden',
                paddingBottom: '8px',
                paddingTop: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
              }}>
              {mapLocations.map((location, index) => (
                <div
                  key={index}
                  onClick={() => handleMarkerClick(index)}
                  style={{
                    minWidth: '280px',
                    flexShrink: 0,
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  {/* Purple number badge */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {index + 1}
                  </div>
                  
                  <div style={{
                    fontWeight: '700',
                    fontSize: '18px',
                    marginBottom: '8px',
                    paddingRight: '40px',
                    textAlign: 'center'
                  }}>
                    {location.name || 'Location'}
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center'
                  }}>
                    {location.address}
                  </div>
                  

                </div>
              ))}
            </div>
          )}
          
          <RideMap 
            locations={mapLocations} 
            selectedMarkerId={selectedMarkerId}
            onMarkerFocus={handleMarkerClick}
          />

          {/* Visualization Loading Overlay - positioned to not cover chat */}
          {isAnalyzing && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: '390px', // Leave space for chat (350px width + 40px margin)
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999, // Lower than chat's z-index of 1000
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '32px 40px',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  Analyzing locations for you, hang tight
                </div>
                
                {/* Loading Spinner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    animation: 'bounce 1.4s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                  }}></div>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '12px'
                }}>
                  Analyzing data and geocoding locations...
                </div>
              </div>
            </div>
          )}
        </div>

        <SimpleChatInterface onMessageSent={handleBotMessage} isAnalyzing={isAnalyzing} />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)