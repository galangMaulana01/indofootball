import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { safeFetch } from '../utils/api';

export default function MatchDetailScreen({ matchId, goBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchData, setMatchData] = useState(null);

  // State khusus untuk menampung data klasemen
  const [standingsData, setStandingsData] = useState(null);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    loadMatchDetail();
  }, [matchId]);

  // Lazy-load Klasemen: fetch klasemen HANYA saat user klik tab "standings" pertama kali
  useEffect(() => {
    if (activeTab === 'standings' && !standingsData && matchData?.fixture?.season_id) {
      fetchStandings(matchData.fixture.season_id);
    }
  }, [activeTab, matchData]);

  const loadMatchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await safeFetch(`/fixtures/${matchId}`);

      const fixtureData = json.data;
      if (!fixtureData) throw new Error('Tidak ada data fixture');

      const participants = fixtureData.participants || [];
      const homeTeam = participants.find((p) => p.meta?.location === 'home') || {};
      const awayTeam = participants.find((p) => p.meta?.location === 'away') || {};

      const venue = fixtureData.venue || {};
      const venueImg = venue.image_path || null;

      const scores = Array.isArray(fixtureData.scores) ? fixtureData.scores : [];
      const homeScore =
        scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'home')
          ?.score?.goals ?? '0';
      const awayScore =
        scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'away')
          ?.score?.goals ?? '0';

      const statusRaw = fixtureData.state?.short_name || 'NS';
      const statusLabel =
        statusRaw === 'FT' ? 'FT' : statusRaw === 'NS' ? 'Belum mulai' : statusRaw;

      setMatchData({ fixture: fixtureData, homeTeam, awayTeam, homeScore, awayScore, statusLabel, venueImg });
    } catch (err) {
      console.error('loadMatchDetail error:', err);
      setError(err.message || 'Gagal memuat data pertandingan');
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
      console.error('Error fetching standings:', err);
    } finally {
      setLoadingStandings(false);
    }
  };

  const renderOverview = () => {
    const { fixture, homeTeam, awayTeam } = matchData;
    const events = fixture.events || [];
    const goalEvents = events.filter((e) => [14, 16, 17].includes(e.type_id));

    const homeScorers = goalEvents.filter((e) => e.participant_id === homeTeam.id);
    const awayScorers = goalEvents.filter((e) => e.participant_id === awayTeam.id);

    const venue = fixture.venue || {};

    const startAt = fixture.starting_at || '';
    let matchDate = '-';
    if (startAt) {
      const d = new Date(startAt);
      matchDate =
        d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) +
        ' ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    const infoItems = [
      { icon: '🏆', label: fixture.league?.name || '-' },
      { icon: '📅', label: matchDate },
      { icon: '🏟️', label: venue.name || '-' },
      { icon: '👥', label: venue.capacity ? `Kapasitas ${venue.capacity}` : '-' },
    ];

    return (
      <View>
        {(homeScorers.length > 0 || awayScorers.length > 0) && (
          <View className="bg-culos rounded-xl p-4 mb-4">
            <View className="flex-row">
              <View className="flex-1 pr-3">
                {homeScorers.length ? (
                  homeScorers.map((e, i) => (
                    <Text key={i} className="text-xs text-white font-medium mb-1.5">
                      {e.minute}' - {e.player_name}
                      {e.type_id === 16 ? ' (P)' : e.type_id === 17 ? ' (OG)' : ''}
                    </Text>
                  ))
                ) : (
                  <Text className="text-xs text-white italic">-</Text>
                )}
              </View>
              <View className="flex-1 pl-3 items-end">
                {awayScorers.length ? (
                  awayScorers.map((e, i) => (
                    <Text key={i} className="text-xs text-white font-medium mb-1.5">
                      {e.player_name}
                      {e.type_id === 16 ? ' (P)' : e.type_id === 17 ? ' (OG)' : ''} - {e.minute}'
                    </Text>
                  ))
                ) : (
                  <Text className="text-xs text-white italic">-</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View className="bg-culos rounded-xl overflow-hidden mb-4">
          <Text className="text-sm font-black text-white uppercase tracking-wider px-4 pt-4 pb-3">
            Match Info
          </Text>
          {infoItems.map((item, i) => (
            <View
              key={i}
              className={`flex-row items-center px-4 py-3 ${
                i < infoItems.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-3">
                <Text className="text-base">{item.icon}</Text>
              </View>
              <Text className="text-sm text-white font-medium flex-1">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderEvents = () => {
    // ... (Kode renderEvents tetap sama persis seperti aslinya)
    const { fixture, homeTeam } = matchData;
    const events = fixture.events || [];
    if (!events.length)
      return (
        <View className="bg-culos p-8 rounded items-center">
          <Text className="text-sm font-medium text-gray-500">Belum ada kejadian tercatat.</Text>
        </View>
      );

    const sorted = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));

    const groupedGroups = [];
    sorted.forEach((e) => {
      if (e.type_id === 10) return;
      const lastGroup = groupedGroups[groupedGroups.length - 1];
      if (
        lastGroup &&
        lastGroup.minute === e.minute &&
        lastGroup.participant_id === e.participant_id
      ) {
        lastGroup.events.push(e);
      } else {
        groupedGroups.push({ minute: e.minute, participant_id: e.participant_id, events: [e] });
      }
    });

    return (
      <View className="px-2 relative mt-2 mb-8">
        <View className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-0" />
        {groupedGroups.map((group, i) => {
          const isHome = group.participant_id === homeTeam.id;
          return (
            <View
              key={i}
              className="flex-row items-center justify-between p-4 mb-3 rounded-xl z-10 bg-culos"
            >
              {isHome ? (
                <>
                  <View className="flex-1 flex-col gap-3">
                    {group.events.map((e, idx) => {
                      if (e.type_id === 18) {
                        return (
                          <View key={idx} className="flex-col gap-2 w-full">
                            <View className="flex-row items-center gap-2">
                              <View className="w-4 h-4 rounded-full bg-white/10 items-center justify-center">
                                <Text className="text-[10px] text-green-500 font-bold" style={{ lineHeight: 12 }}>↑</Text>
                              </View>
                              <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10" />
                              <Text className="text-gray-200 text-xs font-bold" numberOfLines={1}>{e.player_name}</Text>
                            </View>
                            <View className="flex-row items-center gap-2 pl-0.5">
                              <View className="w-4 h-4 rounded-full bg-white/10 items-center justify-center">
                                <Text className="text-[10px] text-red-500 font-bold" style={{ lineHeight: 11 }}>↓</Text>
                              </View>
                              <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10 opacity-50" />
                              <Text className="text-gray-200 text-xs" numberOfLines={1}>{e.related_player_name || '-'}</Text>
                            </View>
                          </View>
                        );
                      }
                      let icon = <Text className="text-xs">⚽</Text>;
                      let label = '';
                      if (e.type_id === 16) label = ' (P)';
                      else if (e.type_id === 17) { icon = <Text className="text-xs">❌</Text>; label = ' (OG)'; }
                      else if (e.type_id === 19) icon = <View className="w-2.5 h-3.5 bg-yellow-500 rounded-sm" />;
                      else if (e.type_id === 20) icon = <View className="w-2.5 h-3.5 bg-red-500 rounded-sm" />;
                      return (
                        <View key={idx} className="flex-row items-center gap-2 w-full">
                          <View className="w-4 items-center justify-center">{icon}</View>
                          <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10" />
                          <Text className="text-white text-xs font-bold" numberOfLines={1}>{e.player_name}{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text className="text-white font-black text-xs pl-4 w-10 text-right">{group.minute}'</Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-black text-xs pr-4 w-10 text-left">{group.minute}'</Text>
                  <View className="flex-1 flex-col gap-3 items-end">
                    {group.events.map((e, idx) => {
                      if (e.type_id === 18) {
                        return (
                          <View key={idx} className="flex-col gap-2 w-full items-end">
                            <View className="flex-row items-center gap-2 justify-end">
                              <Text className="text-white text-xs font-bold text-right" numberOfLines={1}>{e.player_name}</Text>
                              <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10" />
                              <View className="w-4 h-4 rounded-full bg-white/10 items-center justify-center">
                                <Text className="text-[10px] text-green-500 font-bold" style={{ lineHeight: 12 }}>↑</Text>
                              </View>
                            </View>
                            <View className="flex-row items-center gap-2 justify-end pr-0.5">
                              <Text className="text-gray-400 text-xs text-right" numberOfLines={1}>{e.related_player_name || '-'}</Text>
                              <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10 opacity-50" />
                              <View className="w-4 h-4 rounded-full bg-white/10 items-center justify-center">
                                <Text className="text-[10px] text-red-500 font-bold" style={{ lineHeight: 11 }}>↓</Text>
                              </View>
                            </View>
                          </View>
                        );
                      }
                      let icon = <Text className="text-xs">⚽</Text>;
                      let label = '';
                      if (e.type_id === 16) label = ' (P)';
                      else if (e.type_id === 17) { icon = <Text className="text-xs">❌</Text>; label = ' (OG)'; }
                      else if (e.type_id === 19) icon = <View className="w-2.5 h-3.5 bg-yellow-500 rounded-sm" />;
                      else if (e.type_id === 20) icon = <View className="w-2.5 h-3.5 bg-red-500 rounded-sm" />;
                      return (
                        <View key={idx} className="flex-row items-center gap-2 w-full justify-end">
                          <Text className="text-white text-xs font-bold text-right" numberOfLines={1}>{e.player_name}{label}</Text>
                          <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10" />
                          <View className="w-4 items-center justify-center">{icon}</View>
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
    // ... (Kode renderStats tetap sama persis seperti aslinya)
    const { fixture, homeTeam, awayTeam } = matchData;
    const stats = fixture.statistics || [];
    if (!stats.length)
      return (
        <View className="bg-culos p-8 rounded-xl items-center">
          <Text className="text-sm font-medium text-gray-200">Statistik belum tersedia.</Text>
        </View>
      );

    const unique = [];
    stats.forEach((s) => {
      if (s.type && !unique.some((t) => t.id === s.type_id)) {
        unique.push(s.type);
      }
    });

    return (
      <View className="p-5 mb-4">
        {unique.map((type, i) => {
          const homeVal = stats.find((s) => s.type_id === type.id && s.participant_id === homeTeam.id)?.data?.value ?? 0;
          const awayVal = stats.find((s) => s.type_id === type.id && s.participant_id === awayTeam.id)?.data?.value ?? 0;

          const total = parseFloat(homeVal) + parseFloat(awayVal);
          const homePct = total > 0 ? (parseFloat(homeVal) / total) * 100 : 50;
          const awayPct = total > 0 ? (parseFloat(awayVal) / total) * 100 : 50;

          return (
            <View key={i} className="mb-5">
              <Text className="text-white font-black text-xs uppercase tracking-wider text-center mb-3">{type.name}</Text>
              <View className="flex-row items-center">
                <Text className="text-white font-black text-base w-8 text-left">{homeVal}</Text>
                <View className="flex-1 h-4 bg-culos rounded-xl overflow-hidden flex-row justify-end">
                  <View className="h-full rounded-xl bg-red-600" style={{ width: `${homePct}%` }} />
                </View>
                <View className="w-1" />
                <View className="flex-1 h-4 bg-culos rounded-xl overflow-hidden">
                  <View className="h-full rounded-xl bg-yellow-400" style={{ width: `${awayPct}%` }} />
                </View>
                <Text className="text-white font-black text-base w-8 text-right">{awayVal}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLineups = () => {
    // ... (Kode renderLineups tetap sama persis seperti aslinya)
    const { fixture, homeTeam, awayTeam } = matchData;
    const lineups = fixture.lineups || [];
    if (!lineups.length)
      return (
        <View className="bg-culos p-8 rounded-xl items-center">
          <Text className="text-sm font-medium text-gray-500">Susunan pemain belum dirilis.</Text>
        </View>
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
          <View key={i} className="flex-row justify-between py-2 items-center">
            <View className="flex-row items-center gap-3 w-1/2 px-2">
              {h && (
                <>
                  <Image source={{ uri: h.player?.image_path }} className="w-8 h-8 rounded-full bg-white/10" />
                  <Text className="font-semibold text-gray-200 text-xs flex-1" numberOfLines={1}>{h.player_name}</Text>
                </>
              )}
            </View>
            <View className="flex-row items-center gap-3 w-1/2 px-2 justify-end">
              {a && (
                <>
                  <Text className="font-semibold text-gray-200 text-xs text-right flex-1" numberOfLines={1}>{a.player_name}</Text>
                  <Image source={{ uri: a.player?.image_path }} className="w-8 h-8 rounded-full bg-white/10" />
                </>
              )}
            </View>
          </View>
        );
      }
      return rows;
    };

    return (
      <View className="mb-8">
        <Text className="text-xs font-bold text-white uppercase tracking-wider pb-3 text-center mb-1">Starting Eleven</Text>
        <View className="bg-culos shadow-sm rounded-xl p-4 mb-4">{renderList(homeStart, awayStart)}</View>
        <Text className="text-xs font-bold text-white uppercase tracking-wider pb-3 text-center mb-1">Cadangan</Text>
        <View className="bg-culos shadow-sm rounded-xl p-4">{renderList(homeSubs, awaySubs)}</View>
      </View>
    );
  };

  // KOMPONEN RENDER STANDINGS BARU
  const renderStandings = () => {
    if (loadingStandings) {
      return (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator size="large" color="#FC0B12" />
        </View>
      );
    }

    if (!standingsData || standingsData.length === 0) {
      return (
        <View className="bg-culos p-8 rounded-xl items-center">
          <Text className="text-sm font-medium text-gray-500">Data klasemen belum tersedia.</Text>
        </View>
      );
    }

    return (
      <View className="mb-8 bg-culos rounded-xl overflow-hidden pb-4 shadow-sm">
        {/* Table Header */}
        <View className="flex-row items-center px-4 py-3 bg-white/5 border-b border-white/5">
          <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">#</Text>
          <Text className="flex-1 text-[10px] font-bold text-gray-400 uppercase pl-2">Tim</Text>
          <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">M</Text>
          <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">M</Text>
          <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">S</Text>
          <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">K</Text>
          <Text className="w-10 text-center text-[10px] font-bold text-gray-400 uppercase">Poin</Text>
        </View>

        {standingsData.map((item, index) => {
          const team = item.participant || {};
          const details = Array.isArray(item.details) ? item.details : [];

          const won = details.find((d) => d.type?.code === 'wins' || d.type?.name?.toLowerCase().includes('won'))?.value ?? item.won ?? '-';
          const draw = details.find((d) => d.type?.code === 'draws' || d.type?.name?.toLowerCase().includes('draw'))?.value ?? item.draw ?? '-';
          const lost = details.find((d) => d.type?.code === 'lost' || d.type?.name?.toLowerCase().includes('lost'))?.value ?? item.lost ?? '-';
          const played = details.find((d) => d.type?.code === 'matches_played' || d.type?.name?.toLowerCase().includes('played'))?.value ?? item.games_played ?? '-';

          // Highlight tim yang bermain di match ini (Home / Away)
          const isPlayingTeam = team.id === matchData.homeTeam.id || team.id === matchData.awayTeam.id;

          return (
            <View
              key={item.id || index}
              className={`flex-row items-center px-4 py-3 border-b border-white/5 ${isPlayingTeam ? 'bg-white/10' : ''}`}
            >
              <Text className={`text-xs font-bold w-8 text-center ${isPlayingTeam ? 'text-white' : 'text-gray-400'}`}>
                {item.position || index + 1}
              </Text>
              <View className="flex-row items-center flex-1 gap-2 pl-1">
                {team.image_path ? (
                  <Image source={{ uri: team.image_path }} className="w-5 h-5" resizeMode="contain" />
                ) : null}
                <Text className={`text-sm flex-1 ${isPlayingTeam ? 'text-white font-bold' : 'text-gray-300 font-semibold'}`} numberOfLines={1}>
                  {team.name || 'Tim'}
                </Text>
              </View>
              <Text className={`text-xs w-8 text-center ${isPlayingTeam ? 'text-white font-semibold' : 'text-gray-300'}`}>{played}</Text>
              <Text className={`text-xs w-8 text-center ${isPlayingTeam ? 'text-white font-semibold' : 'text-gray-300'}`}>{won}</Text>
              <Text className={`text-xs w-8 text-center ${isPlayingTeam ? 'text-white font-semibold' : 'text-gray-300'}`}>{draw}</Text>
              <Text className={`text-xs w-8 text-center ${isPlayingTeam ? 'text-white font-semibold' : 'text-gray-300'}`}>{lost}</Text>
              <Text className={`text-sm w-10 text-center ${isPlayingTeam ? 'text-white font-black' : 'text-gray-300 font-bold'}`}>
                {item.points ?? '-'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (!loading && error) {
    return (
      <View className="flex-1 bg-equd items-center justify-center px-6">
        <TouchableOpacity onPress={goBack} className="absolute top-6 left-4 p-2 bg-white/10 rounded-full">
          <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text className="text-red-400 text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={loadMatchDetail} className="bg-red-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-equd">
      <ImageBackground
        source={matchData?.venueImg ? { uri: matchData.venueImg } : undefined}
        style={{ paddingTop: 16, paddingBottom: 32 }}
        className="relative z-10 bg-equd"
      >
        <View className="max-w-2xl mx-auto px-4 w-full">
          <View className="flex-row items-center justify-start mb-6">
            <TouchableOpacity onPress={goBack} className="p-2 -ml-2 bg-black/30 rounded-full">
              <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
          </View>

          {loading || !matchData ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#FC0B12" />
            </View>
          ) : (
            <View className="flex-row items-center justify-between px-2">
              <View className="items-center w-[35%]">
                <Image
                  source={{ uri: matchData.homeTeam.image_path || 'https://placehold.co/60' }}
                  className="w-12 h-12 mb-2"
                  resizeMode="contain"
                />
                <Text className="text-[13px] font-bold text-white text-center leading-snug">
                  {matchData.homeTeam.name}
                </Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className="text-4xl font-black tracking-wider text-white mb-2">
                  {matchData.homeScore} - {matchData.awayScore}
                </Text>
                <Text className="text-[10px] font-bold text-gray-200 tracking-wide uppercase">
                  {matchData.statusLabel}
                </Text>
              </View>
              <View className="items-center w-[35%]">
                <Image
                  source={{ uri: matchData.awayTeam.image_path || 'https://placehold.co/60' }}
                  className="w-12 h-12 mb-2"
                  resizeMode="contain"
                />
                <Text className="text-[13px] font-bold text-white text-center leading-snug">
                  {matchData.awayTeam.name}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>

      <View className="bg-culos z-50 shadow-sm">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-w-2xl mx-auto w-full py-3 px-4"
        >
          {/* FIX: Tab 'standings' ditambahkan ke dalam mapping tabs */}
          {['overview', 'events', 'stats', 'lineup', 'standings'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full mr-2 ${
                activeTab === tab ? 'bg-red-600' : 'bg-white/10'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === tab ? 'text-white' : 'text-gray-300'
                }`}
              >
                {tab === 'standings' ? 'Klasemen' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 max-w-2xl p-4 mx-auto w-full" showsVerticalScrollIndicator={false}>
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
