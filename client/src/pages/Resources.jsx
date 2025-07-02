const resources = [
  { title: "Kenya Constitution (2010)", url: "https://www.constituteproject.org/constitution/Kenya_2010" },
  { title: "Citizen Participation Handbook", url: "https://uraia.or.ke/wp-content/uploads/2023/12/Citizen-Handbook.pdf" },
  { title: "Budget Process Explained (YouTube)", url: "https://www.youtube.com/watch?v=vx_wfGf6IIM" },
];

const Resources = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Civic Education Resources</h2>
    <ul className="space-y-2">
      {resources.map((r, idx) => (
        <li key={idx} className="border p-3 rounded">
          <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
            {r.title}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default Resources; 