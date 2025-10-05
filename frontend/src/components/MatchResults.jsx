import React from 'react';

export default function MatchResults({ results }){
  if(!results) return null;
  return (
    <div style={{marginTop:20}}>
      <h3>Matches</h3>
      {results.length === 0 && <p>No matches yet.</p>}
      <ul style={{listStyle:'none', padding:0}}>
        {results.map(r => (
          <li key={r.id} style={{border:'1px solid #ddd', padding:12, marginBottom:10, borderRadius:6}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <strong>{r.name || 'Unnamed'}</strong> <small>({r.email || 'no-email'})</small>
                <div style={{marginTop:6}}><small>Skills: {r.skills}</small></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:18}}>{r.score}%</div>
              </div>
            </div>
            <div style={{marginTop:8}}><pre style={{whiteSpace:'pre-wrap'}}>{r.snippet}</pre></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
