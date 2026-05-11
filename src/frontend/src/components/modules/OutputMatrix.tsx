export default function OutputMatrix() {
  const inputs = ["FILE", "BASS CTX", "HIGHS CTX", "MASTER"];
  const outputs = ["BASS AMP", "MIDS AMP", "SUB", "MASTER OUT"];
  const connected: [number, number][] = [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 1],
    [2, 2],
    [3, 3],
  ];

  return (
    <div className="space-y-3">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        OUTPUT ROUTING MATRIX 4×4
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th
                className="text-left pb-2"
                style={{ color: "rgba(0,212,255,0.5)" }}
              >
                INPUT \ OUTPUT
              </th>
              {outputs.map((o) => (
                <th
                  key={o}
                  className="text-center pb-2 font-bold uppercase tracking-widest"
                  style={{ color: "#00d4ff", fontSize: "0.6rem" }}
                >
                  {o}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputs.map((inp, i) => (
              <tr key={inp}>
                <td
                  className="py-1.5 pr-2 font-bold uppercase tracking-widest"
                  style={{ color: "rgba(0,212,255,0.7)", fontSize: "0.6rem" }}
                >
                  {inp}
                </td>
                {outputs.map((out) => {
                  const j = outputs.indexOf(out);
                  const isConn = connected.some(
                    ([ci, cj]) => ci === i && cj === j,
                  );
                  return (
                    <td key={out} className="text-center py-1.5">
                      <div
                        className="w-5 h-5 rounded mx-auto transition-smooth"
                        style={{
                          background: isConn
                            ? "rgba(0,212,255,0.3)"
                            : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isConn ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
                          boxShadow: isConn
                            ? "0 0 6px rgba(0,212,255,0.4)"
                            : "none",
                        }}
                      >
                        {isConn && (
                          <span
                            style={{
                              color: "#00d4ff",
                              fontSize: "0.7rem",
                              lineHeight: "1.25rem",
                            }}
                          >
                            •
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
