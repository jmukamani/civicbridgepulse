import React from "react";

const PollAnalytics = ({ polls }) => {
  if (!polls || polls.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow text-gray-400 italic">
        No poll data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => {
        const total = poll.totalVotes || 0;
        return (
          <div key={poll.id} className="bg-white p-4 rounded shadow space-y-2">
            <h4 className="font-semibold mb-1">{poll.question}</h4>
            {poll.options.map((opt, idx) => {
              const count = poll.votesCount?.[idx] ?? 0;
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-40 truncate" title={opt}>{opt}</div>
                  <div className="flex-1 bg-gray-200 h-2 rounded">
                    <div
                      className="bg-indigo-600 h-2 rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs w-6 text-right">{count}</span>
                </div>
              );
            })}
            <p className="text-xs text-gray-600">Total votes: {total}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PollAnalytics; 