import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [originalUrl, setOriginalUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')

    try {
      // Use environment variable or default to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/shorten`, {
        originalUrl
      })
      setShortUrl(response.data.shortUrl)
    } catch (err) {
      setError('Failed to shorten URL. Make sure backend is running.')
      console.error(err)
    }
  }

  return (
    <>
      <h1>URL Shortener</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <input 
            type="url" 
            placeholder="Enter URL to shorten"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            style={{ padding: '10px', width: '300px', marginRight: '10px' }}
          />
          <button type="submit">Shorten</button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {shortUrl && (
          <div style={{ marginTop: '20px' }}>
            <p>Shortened URL:</p>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              {shortUrl}
            </a>
          </div>
        )}
      </div>
    </>
  )
}

export default App
