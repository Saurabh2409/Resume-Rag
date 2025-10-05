import React, { useState, useEffect } from 'react';
import ResumeUploader from './components/ResumeUploader.jsx';
import MatchResults from './components/MatchResults.jsx';

export default function App(){
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [jd, setJd] = useState('');

  async function fetchResumes(){
    const r = await fetch('/api/resumes');
    setResumes(await r.json());
  }
  useEffect(()=>{ fetchResumes(); }, []);

  async function handleMatch(){
    const r = await fetch('/api/match', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ jd, top: 10 })
    });
    const json = await r.json();
    setResults(json);
  }

  return (
    <div style={{maxWidth:1000, margin:'2rem auto', fontFamily:'system-ui, sans-serif'}}>
      <h1>ResumeRAG — Resumé Search & Job Match</h1>
      <p>Paste a job description and find best matching resumes.</p>

      <div style={{display:'flex', gap:20}}>
        <div style={{flex:1}}>
          <ResumeUploader onUploaded={fetchResumes}/>
          <div style={{marginTop:20}}>
            <h3>Resumes in DB</h3>
            <ul>
              {resumes.map(r => <li key={r.id}>{r.name || 'Unnamed'} — {r.skills}</li>)}
            </ul>
          </div>
        </div>

        <div style={{flex:2}}>
          <h3>Job Description</h3>
          <textarea value={jd} onChange={e=>setJd(e.target.value)} rows={12} style={{width:'100%'}} placeholder="Paste JD here..."/>
          <button onClick={handleMatch} style={{marginTop:10}}>Match Resumes</button>

          <MatchResults results={results} />
        </div>
      </div>
    </div>
  );
}
