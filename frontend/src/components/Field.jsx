export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", list }) {
  return (
    <input
      type={type}
      value={value}
      list={list}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}
