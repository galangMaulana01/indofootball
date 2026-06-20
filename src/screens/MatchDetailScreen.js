import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { safeFetch } from '../utils/api';

const TrophyIcon = ({ size = 16, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><Path d="M4 22h16" /><Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Svg>
);
const CalendarIcon = ({ size = 16, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></Svg>
);
const StadiumIcon = ({ size = 16, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 20h20M5 20V8l7-5 7 5v12M9 20v-5h6v5" /></Svg>
);
const UsersIcon = ({ size = 16, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
);
const BallIcon = ({ size = 14, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Path d="M12 12l3-2M12 12l-3-2M12 12v3"/></Svg>
);
const ArrowUpIcon = () => <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 19V5M5 12l7-7 7 7"/></Svg>;
const ArrowDownIcon = () => <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M19 12l-7 7-7-7"/></Svg>;

export default function MatchDetailScreen({ matchId, goBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchData, setMatchData] = useState(null);
  const [standingsData, setStandingsData] = useState(null);
  const [loadingStandings, setLoadingStandings] = useState(null);
const [leagueImg, setLeagueData] = useState(null);
  useEffect(() => {
    loadMatchDetail();
  }, [matchId]);

  useEffect(() => {
    if (activeTab === 'standings' && !standingsData && matchData?.fixture?.season_id) {
      fetchStandings(matchData.fixture.season_id);
    }
  }, [activeTab, matchData]);

  const loadMatchDetail = async () => {
    setLoading(true);
    try {
      const json = await safeFetch(`/fixtures/${matchId}`);
      const fixtureData = json.data;
const leagueImg = fixtureData.league;
setLeagueData(leagueImg);
  const liveData = await safeFetch('/livescores/inplay');

  const liveFixture = liveData.data.find(
    m => m.id === Number(matchId)
  );

    const homeTeam = fixtureData.participants?.find((p) => p.meta?.location === 'home') || {};
    const awayTeam = fixtureData.participants?.find((p) => p.meta?.location === 'away') || {};
    const scores = fixtureData.scores || [];
    const homeScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals ?? '0';
    const awayScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals ?? '0';

    const statusRaw = fixtureData.state?.short_name || 'NS';
    const activePeriod =
    liveFixture?.periods?.find(p => p.ticking === true) ||
    liveFixture?.periods?.[liveFixture?.periods?.length - 1];
    let statusLabel = statusRaw; // Default ke status awal
    let isLive = false;
    if (activePeriod) {
      statusLabel = `${activePeriod.minutes}'`;
      isLive = true;
    } else if (statusRaw === 'HT') {
      statusLabel = 'HT';
    } else if (['FT', 'AET', 'FT_PEN'].includes(statusRaw)) {
      statusLabel = 'FT';
    } else if (statusRaw === 'NS') {
      statusLabel = 'Belum Mulai';
    }

    setMatchData({
      fixture: fixtureData,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      statusLabel,
      isLive
    });

    } catch (err) {
      console.log('Error di loadMatchDetail:', err);
    } finally {
      setLoading(false);
    }
  };



  const fetchStandings = async (seasonId) => {
    setLoadingStandings(true);
    try {
      const json = await safeFetch(`/standings/seasons/${seasonId}`);
      setStandingsData(json?.data || []);
    } catch (err) {
      console.log('Error fetching standings:', err);
      setStandingsData([]);
    } finally {
      setLoadingStandings(false);
    }
  };

  const getPossession = () => {
    if (!matchData?.fixture?.statistics) return null;
    const stats = matchData.fixture.statistics;
    const possStat = stats.find(s => s.type_id === 45 || s.type?.name?.toLowerCase().includes('possession'));
    if (!possStat) return null;

    const homeVal = stats.find(s => s.type_id === possStat.type_id && s.participant_id === matchData.homeTeam.id)?.data?.value || 50;
    const awayVal = stats.find(s => s.type_id === possStat.type_id && s.participant_id === matchData.awayTeam.id)?.data?.value || 50;

    return { home: parseInt(homeVal) || 50, away: parseInt(awayVal) || 50 };
  };

  const getMatchPrediction = () => {
    const predictions = matchData?.fixture?.predictions || [];
    return predictions.find(p => p.type_id === 237 || p.type?.code === 'fulltime-result-probability');
  };

  const renderOverview = () => {
    if (!matchData) return null;
    const { fixture, homeTeam, awayTeam } = matchData;
    const events = fixture.events || [];
    const startAt = fixture.starting_at || '';
    let matchDate = '00:00';
    if (startAt) {
      const d = new Date(startAt);
      matchDate = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })} • ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const possession = getPossession();
    const prediction = getMatchPrediction();

    return (
      <View className="mb-8">
        {possession && (
          <View className="bg-culos rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-black text-sm">{possession.home}%</Text>
              <Text className="text-white font-semibold text-xs uppercase">Ball Posession</Text>
              <Text className="text-white font-black text-sm">{possession.away}%</Text>
            </View>
            <View className="w-full h-3 rounded-full overflow-hidden flex-row">
              <View className="bg-red-600 h-full" style={{ width: `${possession.home}%` }} />
              <View className="bg-gray-600 h-full" style={{ width: `${possession.away}%` }} />
            </View>
          </View>
        )}

        {prediction && (
          <View className="bg-culos rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-300 text-xs">Home</Text>
              <Text className="text-gray-300 text-xs">Draw</Text>
              <Text className="text-gray-300 text-xs">Away</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-white font-black text-lg">{prediction.predictions?.home?.toFixed(0) || 0}%</Text>
              <Text className="text-white font-black text-lg">{prediction.predictions?.draw?.toFixed(0) || 0}%</Text>
              <Text className="text-white font-black text-lg">{prediction.predictions?.away?.toFixed(0) || 0}%</Text>
            </View>
            <View className="w-full h-3 rounded-full overflow-hidden flex-row">
              <View className="bg-red-600" style={{ width: `${prediction.predictions?.home || 0}%` }} />
              <View className="bg-gray-500" style={{ width: `${prediction.predictions?.draw || 0}%` }} />
              <View className="bg-yellow-500" style={{ width: `${prediction.predictions?.away || 0}%` }} />
            </View>
          </View>
        )}

        <View className="bg-culos rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informasi Pertandingan</Text>
          <View className="flex-col gap-4">
            <View className="flex-row items-center gap-4">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><TrophyIcon color="#9ca3af" /></View>
              <Text className="text-sm text-white font-medium">{fixture.league?.name}</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><CalendarIcon color="#9ca3af" /></View>
              <Text className="text-sm text-white font-medium">{matchDate}</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><StadiumIcon color="#9ca3af" /></View>
              <Text className="text-sm text-white font-medium">{fixture.venue?.name}</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><UsersIcon color="#9ca3af" /></View>
              <Text className="text-sm text-white font-medium">{fixture.venue?.capacity ? `${fixture.venue.capacity} Kursi`:'-'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEvents = () => {
    const { fixture, homeTeam } = matchData;
    const events = fixture.events || [];
    if (!events.length) return (
      <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-xs text-gray-500 font-medium">Belum ada kejadian tercatat.</Text></View>
    );

    const sorted = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));
    const groupedGroups = [];
    sorted.forEach((e) => {
      if (e.type_id === 10) return;
      const lastGroup = groupedGroups[groupedGroups.length - 1];
      if (lastGroup && lastGroup.minute === e.minute && lastGroup.participant_id === e.participant_id) {
        lastGroup.events.push(e);
      } else {
        groupedGroups.push({ minute: e.minute, participant_id: e.participant_id, events: [e] });
      }
    });

    return (
      <View className="px-2 relative mt-4 mb-8">
        <View className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-0" />
        {groupedGroups.map((group, i) => {
          const isHome = group.participant_id === homeTeam.id;
          return (
            <View key={i} className="flex-row items-center justify-between p-4 mb-4 rounded-2xl z-10 bg-culos shadow-sm">
              {isHome ? (
                <>
                  <View className="flex-1 flex-col gap-3">
                    {group.events.map((e, idx) => {
                      if (e.type_id === 18) return (
                        <View key={idx} className="flex-col gap-1 w-full">
                          <View className="flex-row items-center gap-2"><ArrowUpIcon /><Text className="text-gray-200 text-xs font-bold" numberOfLines={1}>{e.player_name}</Text></View>
                          <View className="flex-row items-center gap-2"><ArrowDownIcon /><Text className="text-gray-400 text-[11px]" numberOfLines={1}>{e.related_player_name || '-'}</Text></View>
                        </View>
                      );
                      let IconCmp = <BallIcon color="white" />;
                      let label = '';
                      if (e.type_id === 16) label = ' (P)';
                      else if (e.type_id === 17) { IconCmp = <BallIcon color="#ef4444" />; label = ' (OG)'; }
                      else if (e.type_id === 19) IconCmp = <View className="w-2.5 h-3.5 bg-yellow-400 rounded-[2px]" />;
                      else if (e.type_id === 20) IconCmp = <View className="w-2.5 h-3.5 bg-red-600 rounded-[2px]" />;
                      return (
                        <View key={idx} className="flex-row items-center gap-3 w-full">
                          <View className="w-4 items-center justify-center">{IconCmp}</View>
                          <Text className="text-white text-xs font-bold" numberOfLines={1}>{e.player_name}{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text className="text-gray-400 font-bold text-xs pl-4 w-10 text-right">{group.minute}'</Text>
                </>
              ) : (
                <>
                  <Text className="text-gray-400 font-bold text-xs pr-4 w-10 text-left">{group.minute}'</Text>
                  <View className="flex-1 flex-col gap-3 items-end">
                    {group.events.map((e, idx) => {
                      if (e.type_id === 18) return (
                        <View key={idx} className="flex-col gap-1 w-full items-end">
                          <View className="flex-row items-center gap-2"><Text className="text-gray-200 text-xs font-bold text-right" numberOfLines={1}>{e.player_name}</Text><ArrowUpIcon /></View>
                          <View className="flex-row items-center gap-2"><Text className="text-gray-400 text-[11px] text-right" numberOfLines={1}>{e.related_player_name || '-'}</Text><ArrowDownIcon /></View>
                        </View>
                      );
                      let IconCmp = <BallIcon color="white" />;
                      let label = '';
                      if (e.type_id === 16) label = ' (P)';
                      else if (e.type_id === 17) { IconCmp = <BallIcon color="#ef4444" />; label = ' (OG)'; }
                      else if (e.type_id === 19) IconCmp = <View className="w-2.5 h-3.5 bg-yellow-400 rounded-[2px]" />;
                      else if (e.type_id === 20) IconCmp = <View className="w-2.5 h-3.5 bg-red-600 rounded-[2px]" />;
                      return (
                        <View key={idx} className="flex-row items-center gap-3 w-full justify-end">
                          <Text className="text-white text-xs font-bold text-right" numberOfLines={1}>{e.player_name}{label}</Text>
                          <View className="w-4 items-center justify-center">{IconCmp}</View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderStats = () => {
    const { fixture, homeTeam, awayTeam } = matchData;
    const stats = fixture.statistics || [];
    if (!stats.length) return (
      <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-xs text-gray-500 font-medium">Statistik belum tersedia.</Text></View>
    );

    const unique = [];
    stats.forEach((s) => {
      if (s.type && !unique.some((t) => t.id === s.type_id)) unique.push(s.type);
    });

    return (
      <View className="bg-culos p-5 rounded-2xl mb-8 shadow-sm">
        {unique.map((type, i) => {
          const homeVal = stats.find((s) => s.type_id === type.id && s.participant_id === homeTeam.id)?.data?.value ?? 0;
          const awayVal = stats.find((s) => s.type_id === type.id && s.participant_id === awayTeam.id)?.data?.value ?? 0;
          const total = parseFloat(homeVal) + parseFloat(awayVal);
          const homePct = total > 0 ? (parseFloat(homeVal) / total) * 100 : 50;
          const awayPct = total > 0 ? (parseFloat(awayVal) / total) * 100 : 50;

          return (
            <View key={i} className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-xs">{homeVal}</Text>
                <Text className="text-white text-xs uppercase">{type.name}</Text>
                <Text className="text-white text-xs">{awayVal}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden flex-row">
                  <View className="h-full bg-red-600 rounded-full" style={{ width: `${homePct}%` }} />
                </View>
                <View className="w-2" />
                <View className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden flex-row justify-end">
                  <View className="h-full bg-gray-500 rounded-full" style={{ width: `${awayPct}%` }} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLineups = () => {
    const { fixture, homeTeam, awayTeam } = matchData;
    const lineups = fixture.lineups || [];
    if (!lineups.length) return (
      <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-xs text-gray-500 font-medium">Susunan pemain belum dirilis.</Text></View>
    );

    const homeStart = lineups.filter((l) => l.team_id === homeTeam.id && l.type_id === 11);
    const awayStart = lineups.filter((l) => l.team_id === awayTeam.id && l.type_id === 11);
    const homeSubs = lineups.filter((l) => l.team_id === homeTeam.id && l.type_id === 12);
    const awaySubs = lineups.filter((l) => l.team_id === awayTeam.id && l.type_id === 12);

    const renderList = (hArr, aArr) => {
      const maxLen = Math.max(hArr.length, aArr.length);
      const rows = [];
      for (let i = 0; i < maxLen; i++) {
        const h = hArr[i];
        const a = aArr[i];
        rows.push(
          <View key={i} className="flex-row justify-between py-3 items-center border-b border-white/5">
            <View className="flex-1 pr-2 items-start">
              {h && <Text className="font-semibold text-gray-200 text-xs" numberOfLines={1}>{h.player_name}</Text>}
            </View>
            <View className="w-px h-full bg-white/5 mx-2" />
            <View className="flex-1 pl-2 items-end">
              {a && <Text className="font-semibold text-gray-200 text-xs text-right" numberOfLines={1}>{a.player_name}</Text>}
            </View>
          </View>
        );
      }
      return rows;
    };

    return (
      <View className="mb-8">
        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Starting XI</Text>
        <View className="bg-culos rounded-2xl px-5 py-2 mb-6 shadow-sm">{renderList(homeStart, awayStart)}</View>
        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Cadangan</Text>
        <View className="bg-culos rounded-2xl px-5 py-2 shadow-sm">{renderList(homeSubs, awaySubs)}</View>
      </View>
    );
  };

  const renderStandings = () => {
    if (loadingStandings) return <View className="py-12 items-center justify-center"><ActivityIndicator size="large" color="#FC0B12" /></View>;
    if (!standingsData || standingsData.length === 0) return <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-xs text-gray-500 font-medium">Data klasemen belum tersedia.</Text></View>;

    const groups = {};
    standingsData.forEach((item) => {
      const key = item.group_id ?? 'main';
      const groupName = item.group?.name ?? 'Klasemen';
      if (!groups[key]) groups[key] = { name: groupName, rows: [] };
      groups[key].rows.push(item);
    });

    Object.values(groups).forEach((g) => g.rows.sort((a, b) => (a.position || 99) - (b.position || 99)));

    return (
      <View className="mb-8">
        {Object.entries(groups).map(([groupId, group]) => (
          <View key={groupId} className="bg-culos rounded-2xl overflow-hidden mb-6 shadow-sm">
            <View className="px-5 py-4 bg-white/5">
              <Text className="text-xs font-bold text-white uppercase tracking-wider">{group.name}</Text>
            </View>
            <View className="flex-row items-center px-4 py-3 bg-black/20">
              <Text className="w-6 text-center text-[10px] font-bold text-gray-500">#</Text>
              <Text className="flex-1 text-[10px] font-bold text-gray-500 pl-2">Klub</Text>
              <Text className="w-8 text-center text-[10px] font-bold text-gray-500">P</Text>
              <Text className="w-8 text-center text-[10px] font-bold text-gray-500">W</Text>
              <Text className="w-8 text-center text-[10px] font-bold text-gray-500">D</Text>
              <Text className="w-8 text-center text-[10px] font-bold text-gray-500">L</Text>
              <Text className="w-8 text-center text-[10px] font-bold text-gray-500">Pts</Text>
            </View>
            {group.rows.map((item, index) => {
              const team = item.participant || {};
              const isPlayingTeam = team.id === matchData.homeTeam.id || team.id === matchData.awayTeam.id;
              const details = Array.isArray(item.details) ? item.details : [];
              const getStat = (id) => details.find((d) => d.type_id === id)?.value ?? '-';

              return (
                <View key={item.id || index} className={`flex-row items-center px-4 py-3 border-t border-white/5 ${isPlayingTeam ? 'bg-red-600/10' : ''}`}>
                  <Text className={`text-[11px] font-bold w-6 text-center ${isPlayingTeam ? 'text-red-400' : 'text-gray-400'}`}>{item.position || index + 1}</Text>
                  <View className="flex-row items-center flex-1 gap-2 pl-2">
                    {team.image_path && <Image source={{ uri: team.image_path }} className="w-5 h-5" resizeMode="contain" />}
                    <Text className={`text-[11px] flex-1 ${isPlayingTeam ? 'text-white font-bold' : 'text-gray-300'}`} numberOfLines={1}>{team.name || 'Tim'}</Text>
                  </View>
                  <Text className={`text-[11px] w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-400'}`}>{getStat(129)}</Text>
                  <Text className={`text-[11px] w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-400'}`}>{getStat(130)}</Text>
                  <Text className={`text-[11px] w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-400'}`}>{getStat(131)}</Text>
                  <Text className={`text-[11px] w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-400'}`}>{getStat(132)}</Text>
                  <Text className={`text-[11px] font-black w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-300'}`}>{item.points ?? '-'}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };


  if (!loading && error) {
    return (
      <View className="flex-1 bg-equd items-center justify-center px-6">
        <TouchableOpacity onPress={goBack} className="absolute top-12 left-6 p-3 bg-white/5 rounded-full">
          <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><Path d="M15 19l-7-7 7-7" /></Svg>
        </TouchableOpacity>
        <Text className="text-gray-400 text-center mb-6">{error}</Text>
        <TouchableOpacity onPress={loadMatchDetail} className="bg-red-600 px-8 py-3 rounded-full">
          <Text className="text-white font-bold text-xs uppercase tracking-wider">Muat Ulang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const goalEvents = matchData?.fixture?.events?.filter(
    (e) => [14, 16, 17].includes(e.type_id)
  ) || [];

  const homeScorers = goalEvents.filter(
    (e) => e.participant_id === matchData?.homeTeam?.id
  );

  const awayScorers = goalEvents.filter(
    (e) => e.participant_id === matchData?.awayTeam?.id
  );


return (
  <View className="flex-1 bg-equd">
    <View className="pt-12 pb-8">
      <View className="max-w-2xl mx-auto px-6 w-full">
        <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center mb-6">
          <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><Path d="M15 19l-7-7 7-7" /></Svg>
        </TouchableOpacity>

        {loading || !matchData ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-between">
              <View className="items-center w-[30%]">
                <Image source={{ uri: matchData.homeTeam.image_path }} className="w-16 h-16 mb-3" resizeMode="contain" />
                <Text className="text-xs font-bold text-white text-center leading-snug">{matchData.homeTeam.name}</Text>
              </View>

              <View className="items-center w-[40%]">
                <Text className="text-5xl font-black tracking-widest text-white mb-2">{matchData.homeScore}<Text className="text-white"> - </Text>{matchData.awayScore}</Text>
                <View className="px-3 py-1 rounded-full">
                  <Text className={`text-xs font-semibold tracking-widest uppercase ${matchData.isLive ? 'text-red-500' : 'text-gray-300'}`}>{matchData.statusLabel}</Text>
                </View>
              </View>

              <View className="items-center w-[30%]">
                <Image source={{ uri: matchData.awayTeam.image_path }} className="w-16 h-16 mb-3" resizeMode="contain" />
                <Text className="text-xs font-bold text-white text-center leading-snug">{matchData.awayTeam.name}</Text>
              </View>
            </View>

            {(homeScorers.length > 0 || awayScorers.length > 0) && (
              <View className="mt-4 flex-row justify-between">
                <View className="flex-1 pr-2">
                  {homeScorers.map((e, i) => <Text key={`home-${i}`} className="text-xs text-white mb-1">{e.minute}' {e.player_name}{e.type_id === 16 ? ' (P)' : ''}{e.type_id === 17 ? ' (OG)' : ''}</Text>)}
                </View>

                <View className="flex-1 pl-2 items-end">
                  {awayScorers.map((e, i) => <Text key={`away-${i}`} className="text-xs text-white mb-1 text-right">{e.player_name}{e.type_id === 16 ? ' (P)' : ''}{e.type_id === 17 ? ' (OG)' : ''} {e.minute}'</Text>)}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>

      <View className="bg-equd border-b border-white/5 z-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-w-2xl mx-auto w-full px-4 py-2">
          {['overview', 'events', 'stats', 'lineup', 'standings'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className="px-1 py-3 mr-6 relative">
                <Text className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {tab === 'standings' ? 'Klasemen' : tab === 'lineup' ? 'Lineup' : tab}
                </Text>
                {isActive && <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 max-w-2xl p-5 mx-auto w-full" showsVerticalScrollIndicator={false}>
        {!loading && matchData && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'lineup' && renderLineups()}
            {activeTab === 'standings' && renderStandings()}
          </>
        )}
      </ScrollView>
    </View>
  );
}
