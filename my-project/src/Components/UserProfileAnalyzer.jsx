import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserProfileAnalyzer() {
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState([]);
  const [commitData, setCommitData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos`);
      const data = await res.json();
      setRepos(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchCommits = async () => {
    const allCommits = [];
    for (const repo of repos.slice(0, 5)) {
      try {
        const res = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=100`);
        const data = await res.json();
        data.forEach((commit) => {
          if (commit?.commit?.author?.date) {
            allCommits.push(commit.commit.author.date);
          }
        });
      } catch (err) {
        console.error(err);
      }
    }

    const commitCountByDate = {};
    allCommits.forEach(dateStr => {
      const date = new Date(dateStr).toISOString().split('T')[0];
      commitCountByDate[date] = (commitCountByDate[date] || 0) + 1;
    });

    const sortedDates = Object.entries(commitCountByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setCommitData(sortedDates);
  };

  const handleSubmit = async () => {
    await fetchRepos();
  };

  useEffect(() => {
    if (repos.length) {
      fetchCommits();
    }
  }, [repos]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">GitHub User Profile Analyzer</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Enter GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : 'Analyze'}
        </Button>
      </div>

      {repos.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mt-4 mb-2">Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <Card key={repo.id}>
                <CardContent className="p-4 space-y-1">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-600 hover:underline">{repo.name}</a>
                  <div>⭐ {repo.stargazers_count} | 🍴 {repo.forks_count}</div>
                  <div className="text-sm text-gray-500">Updated at: {new Date(repo.updated_at).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {commitData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Daily Commits Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commitData}>
              <XAxis dataKey="date" hide={true} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}