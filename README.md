# notepade-api
```javascript
// read from a note
const noteId = 'note_id'
fetch('https://notepade-api.netlify.app/?id='+noteId)
  .then(res=>res.text()).then(console.log);

// write to a note
const newText = 'new_text'
fetch('https://notepade-api.netlify.app/?id='+noteId, {
  method: 'POST',
  body: newText,
}).then(res=>res.text()).then(console.log);
```
