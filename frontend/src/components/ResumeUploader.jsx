import React, { useState } from 'react';

export default function ResumeUploader({ onUploaded }){
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('');

  async function submit(e){
    e.preventDefault();
    await fetch('/api/resumes', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, text, skills })
    });
    setText(''); setName(''); setEmail(''); setSkills('');
    if (onUploaded) onUploaded();
  }

  return (
    <div>
      <h3>Upload / Paste Resume</h3>
      <form onSubmit={submit}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{width:'100%'}}/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', marginTop:6}}/>
        <textarea placeholder="Paste resume text or copy from PDF" value={text} onChange={e=>setText(e.target.value)} rows={8} style={{width:'100%', marginTop:6}}/>
        <input placeholder="Comma-separated skills (optional)" value={skills} onChange={e=>setSkills(e.target.value)} style={{width:'100%', marginTop:6}}/>
        <button type="submit" style={{marginTop:8}}>Save Resume</button>
      </form>
    </div>
  );
}
