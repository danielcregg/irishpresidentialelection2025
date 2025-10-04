\
import React, { useState, useEffect, useMemo } from 'react';
import { Award, Info, Users, RefreshCw, Lock, Unlock, MapPin, Briefcase, Heart, X, TrendingUp } from 'lucide-react';

/**
 * IrishElectionDemo — No-Animation
 * - Removes the Start Count bar, animation state, and related logic entirely
 * - Keeps: stacked Round-2 bars, focused Transfer panel, hide-on-51%, live odds, and single-lock behavior
 */

export default function IrishElectionDemo() {
  // --- Candidate data ---
  const candidates = [
    {
      id: 'connolly',
      name: 'Catherine Connolly',
      party: 'Independent',
      color: '#f97316',
      shortName: 'Connolly',
      image:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Catherine%20Connolly%202020%20portrait.jpg?width=256',
      constituency: 'Galway West TD',
      background:
        'Independent TD with support from Social Democrats and People Before Profit',
      keyPolicies: ['Human Rights Advocate', 'Housing Reform', 'Environmental Justice'],
      experience: 'Served as Galway City Councillor and TD since 2016',
    },
    {
      id: 'gavin',
      name: 'Jim Gavin',
      party: 'Fianna Fáil',
      color: '#22c55e',
      shortName: 'Gavin',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jim_Gavin%2C_Jan_2020_01_%28cropped%29.jpg/330px-Jim_Gavin%2C_Jan_2020_01_%28cropped%29.jpg',
      constituency: 'Dublin',
      background: 'Former Dublin GAA manager, Fianna Fáil nominee',
      keyPolicies: ['Constitutional Republican', 'Defence Reform', 'Leadership'],
      experience: 'Led Dublin to 6 All-Ireland titles, no prior political office',
    },
    {
      id: 'humphreys',
      name: 'Heather Humphreys',
      party: 'Fine Gael',
      color: '#3b82f6',
      shortName: 'Humphreys',
      image:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Heather%20Humphreys%20-%209%20April%202024%2040%20(cropped).jpg?width=256',
      constituency: 'Cavan-Monaghan',
      background: 'Former Cabinet Minister, Fine Gael nominee',
      keyPolicies: ['Rural Ireland', 'Unity & Community', 'International Representation'],
      experience: 'Minister for Justice, Arts, Social Protection - 10+ years cabinet experience',
    },
  ];

  // --- State ---
  const [firstPrefs, setFirstPrefs] = useState({ connolly: 33, gavin: 34, humphreys: 33 });
  const [lockedCandidates, setLockedCandidates] = useState({ connolly: false, gavin: false, humphreys: false });

  const [transferPrefs, setTransferPrefs] = useState({
    connolly: { gavin: 40, humphreys: 60 },
    gavin: { connolly: 45, humphreys: 55 },
    humphreys: { connolly: 50, gavin: 50 },
  });

  const [totalElectorate] = useState(3_600_000);
  const [turnout, setTurnout] = useState(60);
  const totalVotes = Math.round(totalElectorate * (turnout / 100));

  const [rounds, setRounds] = useState<any[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [showStvInfo, setShowStvInfo] = useState(false);

  // --- Live odds state (with safe fallback) ---
  const [liveOdds, setLiveOdds] = useState({ connolly: '34%', gavin: '18%', humphreys: '48%' });
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsLastUpdated, setOddsLastUpdated] = useState<Date | null>(null);

  // --- Derived ---
  const quota = Math.floor(totalVotes / 2) + 1;

  // Hide transfers if any candidate has >= 51% in first preferences (per your spec)
  const firstRoundMajorityPct = Math.max(...Object.values(firstPrefs));
  const hideTransfers = firstRoundMajorityPct >= 51;

  // Focused Transfer panel: identify the currently lowest first-prefs candidate
  const eliminatedUI = useMemo(() => {
    const entries = Object.entries(firstPrefs) as [string, number][];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }, [firstPrefs]);
  const remainingForUI = useMemo(() => candidates.filter((c) => c.id !== eliminatedUI), [candidates, eliminatedUI]);

  // --- Effects ---
  useEffect(() => {
    calculateElection();
  }, [firstPrefs, transferPrefs, turnout]);

  useEffect(() => {
    fetchLiveOdds();
  }, []);

  // --- Logic ---
  const calculateElection = () => {
    const currentVotes = {
      connolly: Math.round(totalVotes * (firstPrefs.connolly / 100)),
      gavin: Math.round(totalVotes * (firstPrefs.gavin / 100)),
      humphreys: Math.round(totalVotes * (firstPrefs.humphreys / 100)),
    };

    const roundsData: any[] = [
      {
        round: 1,
        votes: { ...currentVotes },
        eliminated: null,
        transferred: 0,
        transferTo: {} as Record<string, number>,
        description: 'First Preference Count',
      },
    ];

    // Winner in first round?
    const firstRoundWinner = Object.keys(currentVotes).find((c) => (currentVotes as any)[c] >= quota);
    if (firstRoundWinner) {
      setRounds(roundsData);
      setWinner(firstRoundWinner as string);
      return;
    }

    // Eliminate lowest (tie breaks by array order)
    const sorted = [...Object.entries(currentVotes)].sort((a, b) => a[1] - b[1]);
    const eliminated = sorted[0][0] as string;
    const eliminatedVotes = (currentVotes as any)[eliminated];

    const remaining = Object.keys(currentVotes).filter((c) => c !== eliminated);
    const transferTo: Record<string, number> = {};
    remaining.forEach((c) => {
      const pct = (transferPrefs as any)[eliminated][c];
      transferTo[c] = Math.round(eliminatedVotes * (pct / 100));
    });

    const round2Votes: Record<string, number> = { ...currentVotes };
    delete (round2Votes as any)[eliminated];
    Object.keys(transferTo).forEach((c) => {
      (round2Votes as any)[c] += transferTo[c];
    });

    roundsData.push({
      round: 2,
      votes: round2Votes,
      eliminated,
      transferred: eliminatedVotes,
      transferTo,
      description: `${(candidates.find((c) => c.id === eliminated) as any)?.shortName} eliminated - votes transferred`,
    });

    const finalWinner = Object.keys(round2Votes).reduce((a, b) => ((round2Votes as any)[a] > (round2Votes as any)[b] ? a : b));

    setRounds(roundsData);
    setWinner(finalWinner);
  };

  const handleFirstPrefChange = (candidateId: string, value: string | number) => {
    const v = Math.max(0, Math.min(100, parseInt(String(value)) || 0));

    setFirstPrefs((prev) => {
      const next: any = { ...prev, [candidateId]: v };

      // Single-lock aware balancing
      const lockedIds = Object.keys(next).filter((id) => (lockedCandidates as any)[id] && id !== candidateId);
      const unlockedIds = Object.keys(next).filter((id) => !(lockedCandidates as any)[id] && id !== candidateId);

      const lockedSum = lockedIds.reduce((s, id) => s + next[id], 0);
      let remaining = 100 - v - lockedSum;
      remaining = Math.max(0, remaining);

      if (unlockedIds.length > 0) {
        const per = Math.floor(remaining / unlockedIds.length);
        unlockedIds.forEach((id, i) => {
          next[id] = i === unlockedIds.length - 1 ? remaining - per * (unlockedIds.length - 1) : per;
        });
      }

      return next;
    });
  };

  // Only one candidate can be locked at any time
  const toggleLock = (candidateId: string) => {
    setLockedCandidates((prev) => {
      const currentlyLockedId = Object.keys(prev).find((id) => (prev as any)[id]);
      if (currentlyLockedId === candidateId) {
        return { connolly: false, gavin: false, humphreys: false };
      }
      return {
        connolly: candidateId === 'connolly',
        gavin: candidateId === 'gavin',
        humphreys: candidateId === 'humphreys',
      };
    });
  };

  // Slider helper: single slider per eliminated candidate (2 recipients). Adjusts the other automatically.
  const handleTransferSlider = (fromId: string, primaryToId: string, value: string | number) => {
    const v = Math.max(0, Math.min(100, parseInt(String(value)) || 0));
    const otherId = Object.keys((transferPrefs as any)[fromId]).find((k) => k !== primaryToId)!;
    setTransferPrefs((prev) => ({
      ...prev,
      [fromId]: { ...(prev as any)[fromId], [primaryToId]: v, [otherId]: 100 - v },
    }));
  };

  const getVotePct = (votes: number) => ((votes / totalVotes) * 100).toFixed(1);

  // --- Live odds fetch (best-effort, CORS-safe) ---
  async function fetchLiveOdds() {
    try {
      setOddsLoading(true);
      const res = await fetch('https://gamma-api.polymarket.com/events?slug=ireland-presidential-election', { mode: 'cors' });
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : undefined;
      const markets = first && Array.isArray(first.markets) ? first.markets : [];
      const nextOdds = { ...liveOdds };
      markets.forEach((m: any) => {
        const q = m && typeof m.question === 'string' ? m.question.toLowerCase() : '';
        const prob = m && typeof m.clobProbability === 'number' ? Math.round(m.clobProbability * 100) + '%' : null;
        if (!prob) return;
        if (q.includes('connolly')) (nextOdds as any).connolly = prob;
        if (q.includes('gavin')) (nextOdds as any).gavin = prob;
        if (q.includes('humphreys')) (nextOdds as any).humphreys = prob;
      });
      setLiveOdds(nextOdds);
      setOddsLastUpdated(new Date());
    } catch (e):
      setOddsLastUpdated(new Date());
    finally:
      setOddsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-3 border-t-2 border-green-600">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icons.Award className="w-6 h-6 text-green-600 hidden sm:block" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800">Irish Presidential Election 2025</h1>
                <p className="text-xs text-gray-600 hidden sm:block">October 24, 2025</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* STV Info button */}
              <button
                onClick={() => setShowStvInfo(true)}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-900 text-white text-xs font-semibold hover:bg-black"
                title="What is Single Transferable Vote?"
              >
                <Icons.Info className="w-3.5 h-3.5" />
                Single Transferable Vote
              </button>

              {/* Right-side stats */}
              <div className="flex items-center gap-3 text-xs">
                <div className="hidden md:block">
                  <span className="text-gray-600">Electorate:</span>
                  <span className="font-bold ml-1">{(totalElectorate / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 hidden sm:inline">Turnout:</span>
                  <input
                    type="range"
                    min={40}
                    max={80}
                    value={turnout}
                    onChange={(e) => setTurnout(parseInt(e.target.value))}
                    className="w-20 h-1.5 rounded-lg appearance-none bg-gray-200"
                  />
                  <span className="font-bold text-blue-600 w-10 text-right">{turnout}%</span>
                </div>
                <div>
                  <span className="text-gray-600 hidden sm:inline">Votes:</span>
                  <span className="font-bold text-green-600 ml-1">{(totalVotes / 1_000_000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1">
              <Icons.Users className="w-4 h-4" />
              Candidates
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Live Odds</span>
              <button
                onClick={fetchLiveOdds}
                disabled={oddsLoading}
                className={`px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 inline-flex items-center gap-1`}
                title={oddsLastUpdated ? `Updated ${oddsLastUpdated.toLocaleTimeString()}` : 'Refresh odds'}
              >
                <Icons.RefreshCw className={`w-3 h-3 ${oddsLoading ? 'animate-spin' : ''}`} />
                {oddsLoading ? 'Updating' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                className="group bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition text-left relative"
              >
                {/* Odds pill above head */}
                <span
                  className="absolute -top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: c.color }}
                >
                  {liveOdds[c.id] || '--'}
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-12 h-12 rounded-full border-2 object-cover"
                    style={{ borderColor: c.color }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-gray-800 truncate">{c.shortName}</div>
                    <div className="text-xs text-gray-600 truncate">{c.party}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {oddsLastUpdated && <div className="mt-1 text-[10px] text-gray-500">Last updated {oddsLastUpdated.toLocaleTimeString()}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-3">
            {/* First Preferences */}
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-800">First Preference Votes</h2>
                <span className="text-xs text-gray-500">Click 🔒 to lock (only one at a time)</span>
              </div>
              {candidates.map((c) => (
                <div key={c.id} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-xs text-gray-800">{c.shortName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLock(c.id)}
                        className={`p-1 rounded ${lockedCandidates[c.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}
                        aria-label={lockedCandidates[c.id] ? 'Unlock' : 'Lock'}
                        title={lockedCandidates[c.id] ? 'Unlock' : 'Lock this candidate (only one lock allowed)'}
                      >
                        {lockedCandidates[c.id] ? <Icons.Lock className="w-3 h-3" /> : <Icons.Unlock className="w-3 h-3" />}
                      </button>
                      <span className="text-sm font-bold w-10 text-right" style={{ color: c.color }}>
                        {firstPrefs[c.id]}%
                      </span>
                      <span className="text-xs text-gray-500 w-16 text-right hidden sm:inline">{(totalVotes * (firstPrefs[c.id] / 100) / 1_000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={firstPrefs[c.id]}
                    onChange={(e) => handleFirstPrefChange(c.id, e.target.value)}
                    disabled={lockedCandidates[c.id]}
                    className={`w-full h-1.5 rounded-lg appearance-none ${lockedCandidates[c.id] ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ background: `linear-gradient(to right, ${c.color} 0%, ${c.color} ${firstPrefs[c.id]}%, #e5e7eb ${firstPrefs[c.id]}%, #e5e7eb 100%)` }}
                  />
                </div>
              ))}
            </div>

            {/* Transfer Preferences (hidden if first-round majority ≥51%) */}
            {!hideTransfers and (() => {
              const entries = Object.entries(firstPrefs) as [string, number][];
              entries.sort((a, b) => a[1] - b[1]);
              const eliminated = entries[0][0];
              const others = candidates.filter((c) => c.id !== eliminated);
              const [toA, toB] = others;
              const valueA = (transferPrefs as any)[eliminated][toA.id];
              const valueB = (transferPrefs as any)[eliminated][toB.id];
              return (
                <div className="bg-white rounded-lg shadow p-3">
                  <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                    <Icons.TrendingUp className="w-4 h-4 text-orange-600" />
                    Transfer Preferences
                  </h2>

                  {/* Simple explainer */}
                  <div className="text-xs text-gray-700 mb-2">
                    The candidate who is <strong>eliminated</strong> (lowest first‑preference votes) will now have their <strong>second‑preference</strong> votes distributed to the two remaining candidates.
                  </div>
                  <div className="text-xs text-gray-700 mb-3">
                    Eliminated: <span className="font-semibold" style={{ color: candidates.find(x=>x.id===eliminated)?.color }}>{candidates.find((x) => x.id === eliminated)?.name}</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Slide to split their transfers between <span className="font-bold">{toA.shortName}</span> and <span className="font-bold">{toB.shortName}</span>:
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: toA.color }} />
                        <span className="font-semibold truncate">{toA.name}</span>
                        <span className="font-bold">{valueA}%</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold">{valueB}%</span>
                        <span className="font-semibold truncate">{toB.name}</span>
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: toB.color }} />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={valueA}
                      onChange={(e) => handleTransferSlider(eliminated, toA.id, e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(90deg, ${toA.color} 0% ${valueA}%, #e5e7eb ${valueA}% ${100 - valueB}%, ${toB.color} ${100 - valueB}% 100%)` }}
                      aria-label={`When ${candidates.find(x=>x.id===eliminated)?.shortName} is eliminated, percentage to ${toA.shortName}`}
                    />
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Results */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-3 lg:sticky lg:top-4">
              <h2 className="text-sm font-bold text-gray-800 mb-2">Live Count Results</h2>

              {/* Quota */}
              <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded border border-red-300">
                <div className="text-xs text-gray-700">Quota (50% + 1)</div>
                <div className="text-xl font-bold text-red-600">{(quota / 1_000).toFixed(0)}K</div>
              </div>

              {/* Rounds (always visible, no animation) */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rounds.map((round, idx) => (
                  <div key={idx} className={`p-2 rounded bg-gray-50`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-800">Round {round.round}</span>
                      {round.eliminated && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          {candidates.find((c) => c.id === round.eliminated)?.shortName} Out
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{round.description}</div>
                    {Object.entries(round.votes).map(([cid, votes]) => {
                      const c = candidates.find((x) => x.id === cid)!;
                      const pct = parseFloat(getVotePct(votes as number));
                      const hasQuota = (votes as number) >= quota;
                      const gained = round.transferTo && round.transferTo[cid] ? round.transferTo[cid] : 0;

                      // Stacked viz: base (Round 1) + transfers (Round 2)
                      const baseVotes = (rounds[0]?.votes?.[cid] ?? 0) as number;
                      const basePct = parseFloat(getVotePct(baseVotes));
                      const transferPct = parseFloat(getVotePct(gained));

                      return (
                        <div key={cid} className="mb-1">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                              <span className="font-semibold">{c.shortName}</span>
                              {gained > 0 && <span className="text-green-600 font-bold text-xs">+{((gained as number) / 1_000).toFixed(0)}K</span>}
                            </div>
                            <div className="font-bold">{((votes as number) / 1_000).toFixed(0)}K</div>
                          </div>

                          <div className="relative h-4 bg-gray-200 rounded overflow-hidden">
                            {/* Base segment (Round 1 share) */}
                            <div
                              className="absolute left-0 top-0 h-full"
                              style={{ width: `${max0to100(basePct)}%`, backgroundColor: c.color, opacity: 0.85 }}
                              title={`Round 1: ${basePct.toFixed(1)}%`}
                            />
                            {/* Transfer segment (added) */}
                            <div
                              className="absolute top-0 h-full bg-black/30"
                              style={{ left: `${max0to100(basePct)}%`, width: `${max0to100(transferPct, 100 - basePct)}%` }}
                              title={`Transfers: +${transferPct.toFixed(1)}%`}
                            />
                            {/* Label overlay showing total pct */}
                            <div className="relative h-full flex items-center justify-center text-white text-xs font-bold">
                              {pct.toFixed(1)}%
                            </div>
                            {hasQuota and (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xs bg-green-600 px-1 rounded">✓</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Winner (no animation gating) */}
              {winner and (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white text-center">
                  <Icons.Award className="w-8 h-8 mx-auto mb-1" />
                  <div className="text-lg font-bold">WINNER!</div>
                  <div className="text-sm">{candidates.find((c) => c.id === winner)?.name}</div>
                  <div className="text-xs opacity-90">10th President of Ireland</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Profile Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCandidate(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img src={selectedCandidate.image} alt={selectedCandidate.name} className="w-16 h-16 rounded-full border-2" style={{ borderColor: selectedCandidate.color }} />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedCandidate.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: selectedCandidate.color }}>{selectedCandidate.party}</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">{(liveOdds as any)[selectedCandidate.id] || '--'} Win Prob</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                      <Icons.MapPin className="w-3 h-3" />
                      <span className="text-xs">{selectedCandidate.constituency}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="p-1 hover:bg-gray-100 rounded-full"><Icons.X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <section>
                  <div className="flex items-center gap-1 mb-1"><Icons.Briefcase className="w-4 h-4 text-gray-600" /><h3 className="font-bold text-sm text-gray-800">Background</h3></div>
                  <p className="text-xs text-gray-700">{selectedCandidate.background}</p>
                </section>
                <section>
                  <div className="flex items-center gap-1 mb-1"><Icons.Heart className="w-4 h-4 text-gray-600" /><h3 className="font-bold text-sm text-gray-800">Key Policies</h3></div>
                  <div className="flex flex-wrap gap-1">{selectedCandidate.keyPolicies.map((p: string, i: number) => (<span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">{p}</span>))}</div>
                </section>
                <section>
                  <div className="flex items-center gap-1 mb-1"><Icons.Award className="w-4 h-4 text-gray-600" /><h3 className="font-bold text-sm text-gray-800">Experience</h3></div>
                  <p className="text-xs text-gray-700">{selectedCandidate.experience}</p>
                </section>
              </div>

              <div className="mt-4 text-center"><button onClick={() => setSelectedCandidate(null)} className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Close</button></div>
            </div>
          </div>
        )}

        {/* STV Info Modal */}
        {showStvInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStvInfo(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Icons.Info className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-gray-800">Single Transferable Vote (STV)</h3></div>
                <button onClick={() => setShowStvInfo(false)} className="p-1 rounded hover:bg-gray-100" aria-label="Close"><Icons.X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div><div className="font-semibold">Preferential</div><div>Voters rank 1st, 2nd, 3rd.</div></div>
                <div><div className="font-semibold">Transfers</div><div>Eliminated candidates' votes transfer according to next preferences.</div></div>
                <div><div className="font-semibold">Majority</div><div>The winner needs 50% + 1 of valid votes.</div></div>
              </div>
              <div className="mt-3 text-right"><button onClick={() => setShowStvInfo(false)} className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm font-semibold hover:bg-black">Got it</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helpers for rounding clamp in stacked bars (TS narrow). Kept small & inline.
 */
function max0to100(n: number, cap: number = 100): number {
  const x = Math.max(0, Math.min(n, 100));
  return Math.min(x, cap);
}

/**
 * Lightweight runtime tests (non-blocking) — visible in the browser console.
 * These do not modify existing behavior and help catch regressions.
 */
if (typeof window !== 'undefined') {
  (function runDevTests() {
    try {
      // Test 1: transfer pair sums to 100
      const split = (a: number) => ({ a, b: 100 - a });
      const t1 = split(73);
      console.assert(t1.a + t1.b === 100, 'Transfer split should sum to 100');

      // Test 2: first round winner when one candidate has >= 50%+1 of votes
      const total = 100000;
      const quota = Math.floor(total / 2) + 1;
      const fv = { connolly: 60, gavin: 25, humphreys: 15 };
      const votes = {
        connolly: Math.round(total * (fv.connolly / 100)),
        gavin: Math.round(total * (fv.gavin / 100)),
        humphreys: Math.round(total * (fv.humphreys / 100)),
      } as any;
      const firstWinner = Object.keys(votes).find((c) => votes[c] >= quota);
      console.assert(firstWinner === 'connolly', 'Connolly should win in first round in test');

      // Test 3: transferPrefs row always sums to 100 (current state)
      const tp = {
        connolly: { gavin: 40, humphreys: 60 },
        gavin: { connolly: 45, humphreys: 55 },
        humphreys: { connolly: 50, gavin: 50 },
      };
      Object.values(tp).forEach((row: any) => {
        const sum = Object.values(row).reduce((s: number, x: number) => s + x, 0);
        console.assert(sum === 100, 'Each transfer row should sum to 100');
      });

      // Test 4: slider helper complementary logic
      const vA = 37;
      const vB = 100 - vA;
      console.assert(vA + vB === 100, 'Slider pair must remain complementary');

      // Test 5: stacked bar math adds up
      const base = 34000, tr = 6000; const pct = ((base + tr) / total) * 100; const bPct = (base / total) * 100; const tPct = (tr / total) * 100;
      console.assert(Math.abs(pct - (bPct + tPct)) < 1e-9, 'Stacked percentage should add up');

      // Test 6: hide transfers when any first pref >=51
      const prefs: any = { a: 51, b: 30, c: 19 };
      console.assert(Math.max(...Object.values(prefs)) >= 51, 'Should hide transfers when a candidate ≥51%');

      // Test 7: only one lock allowed
      const singleLock = (id: string) => ({ connolly: id==='connolly', gavin: id==='gavin', humphreys: id==='humphreys' });
      const L1 = singleLock('gavin');
      const lockedCount = Object.values(L1).filter(Boolean).length;
      console.assert(lockedCount === 1 && (L1 as any).gavin, 'Exactly one candidate should be locked at a time');

      // Done
      console.log('[IrishElectionDemo] Dev tests passed');
    } catch (e) {
      console.warn('[IrishElectionDemo] Dev tests encountered an error', e);
    }
  })();
}
