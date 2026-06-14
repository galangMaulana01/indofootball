import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";

export default function MatchDetailScreen({ matchId, goBack }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    loadMatchDetail();
  }, [matchId]);

  const loadMatchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fixtures/${matchId}?include=participants,scores,events,statistics,lineups,venue,formations`);
      const json = await res.json();

      const fixtureData = json.data;
      if (!fixtureData) throw new Error("Tidak ada data match");

      const participants = fixtureData.participants || [];
      const homeTeam = participants.find(p => p.meta?.location === 'home') || {};
      const awayTeam = participants.find(p => p.meta?.location === 'away') || {};
      // FIX 1: Ambil venue dari fixtureData
      const venue = fixtureData.venue || {};
      const venueImg = venue.image_path || null;

      const homeScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "0";
      const awayScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "0";
      const statusRaw = fixtureData.state?.short_name || "NS";
      const statusLabel = statusRaw === "FT" ? "FT" : (statusRaw === "NS" ? "Belum mulai" : statusRaw);

      // FIX 2: Masukin venueImg ke state
      setMatchData({ fixture: fixtureData, homeTeam, awayTeam, homeScore, awayScore, statusLabel, venueImg });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

const renderOverview = () => {
    const { fixture, homeTeam, awayTeam } = matchData;
    const events = fixture.events || [];
    const goalEvents = events.filter(e => [14,16,17].includes(e.type_id));

    const homeScorers = goalEvents.filter(e => e.participant_id === homeTeam.id);
    const awayScorers = goalEvents.filter(e => e.participant_id === awayTeam.id);

    const venue = fixture.venue || {};
    const formations = fixture.formations || [];
    const homeForm = formations.find(f => f.participant_id === homeTeam.id)?.formation || '-';
    const awayForm = formations.find(f => f.participant_id === awayTeam.id)?.formation || '-';

    // Format tanggal
    const startAt = fixture.starting_at || '';
    let matchDate = '-';
    if (startAt) {
      const d = new Date(startAt);
      matchDate = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
        + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    const infoItems = [
      { icon: '🏆', label: fixture.league?.name },
      { icon: '📅', label: matchDate },
      { icon: '🏟️', label: venue.name },
      { icon: '👤', label: venue.capacity },
    ];

    return (
      <View>
        {(homeScorers.length > 0 || awayScorers.length > 0) && (
          <View className="bg-culos rounded-xl p-4 mb-4">
            <View className="flex-row">
              <View className="flex-1 pr-3">
                {homeScorers.length ? homeScorers.map((e, i) => (
                  <Text key={i} className="text-xs text-white font-medium mb-1.5">{e.minute}' - {e.player_name}{e.type_id===16?' (P)':e.type_id===17?' (OG)':''}</Text>
                )) : <Text className="text-xs text-white italic">-</Text>}
              </View>
              <View className="flex-1 pl-3 items-end">
                {awayScorers.length ? awayScorers.map((e, i) => (
                  <Text key={i} className="text-xs text-white font-medium mb-1.5">{e.player_name}{e.type_id===16?' (P)':e.type_id===17?' (OG)':''} - {e.minute}'</Text>
                )) : <Text className="text-xs text-white italic">-</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Info Pertandingan - layout referensi */}
        <View className="bg-culos rounded-xl overflow-hidden mb-4">
          <Text className="text-sm font-black text-white uppercase tracking-wider px-4 pt-4 pb-3">Match Info</Text>
          {infoItems.map((item, i) => (
            <View key={i} className={`flex-row items-center px-4 py-3 ${i < infoItems.length - 1 ? 'border-b border-white/5' : ''}`}>
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
    const { fixture, homeTeam } = matchData;
    const events = fixture.events || [];
    if (!events.length) return (
      <View className="bg-culos p-8 rounded items-center">
        <Text className="text-sm font-medium text-gray-500">Belum ada kejadian tercatat.</Text>
      </View>
    );

    // 1. Urutkan kejadian berdasarkan menit maju
    const sorted = [...events].sort((a, b) => a.minute - b.minute);

    // 2. LOGIKA GROUPING: Satukan kejadian jika menit dan timnya SAMA
    const groupedGroups = [];
    sorted.forEach(e => {
      if (e.type_id === 10) return; // Lewati jika type_id 10

      const lastGroup = groupedGroups[groupedGroups.length - 1];
      // Jika menit & tim sama dengan kejadian sebelumnya, gabungkan!
      if (lastGroup && lastGroup.minute === e.minute && lastGroup.participant_id === e.participant_id) {
        lastGroup.events.push(e);
      } else {
        // Jika beda menit atau beda tim, buat kotak (group) baru
        groupedGroups.push({
          minute: e.minute,
          participant_id: e.participant_id,
          events: [e]
        });
      }
    });

    return (
      <View className="px-2 relative mt-2 mb-8">
        {/* Garis putus-putus tengah (Timeline Axis) */}
        <View 
          className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent border-l border-white z-0" 
          style={{ transform: [{ translateX: -0.5 }], borderStyle: 'dashed' }} 
        />

        {groupedGroups.map((group, i) => {
          const isHome = group.participant_id === homeTeam.id;
          const cardBg = isHome ? 'bg-red-500' : 'bg-yellow-500';

          return (
            <View key={i} className={`flex-row items-center justify-between p-4 mb-3 rounded-xl z-10 bg-culos`}>
              {isHome ? (
                <>
                  <View className="flex-1 flex-col gap-3">
                    {group.events.map((e, idx) => {
                      if (e.type_id === 18) {
                        return (
                          <View key={idx} className="flex-col gap-2 w-full">
                            {/* Pemain Masuk */}
                            <View className="flex-row items-center gap-2">
                              <View className="w-4 h-4 rounded-full bg-white/10 items-center justify-center">
                                <Text className="text-[10px] text-green-500 font-bold" style={{ lineHeight: 12 }}>↑</Text>
                              </View>
                              <Image source={{ uri: e.player?.image_path }} className="w-5 h-5 rounded-full bg-white/10" />
                              <Text className="text-gray-200 text-xs font-bold" numberOfLines={1}>{e.player_name}</Text>
                            </View>
                            {/* Pemain Keluar */}
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

                      // Aksi Lainnya (Gol, Kartu)
                      let icon = <Text className="text-xs">⚽</Text>;
                      let label = "";
                      if (e.type_id === 16) label = " (Penalti)";
                      else if (e.type_id === 17) { icon = <Text className="text-xs">❌</Text>; label = " (Bunuh Diri)"; }
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
                            {/* Pemain Keluar */}
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

                      // Aksi Lainnya (Gol, Kartu)
                      let icon = <Text className="text-xs">⚽</Text>;
                      let label = "";
                      if (e.type_id === 16) label = " (Penalti)";
                      else if (e.type_id === 17) { icon = <Text className="text-xs">❌</Text>; label = " (Bunuh Diri)"; }
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
    const { fixture, homeTeam, awayTeam } = matchData;
    const stats = fixture.statistics || [];
    if (!stats.length) return (
      <View className="bg-culos p-8 rounded-xl items-center">
        <Text className="text-sm font-medium text-gray-200">Statistik belum tersedia.</Text>
      </View>
    );

    let unique = [];
    stats.forEach(s => { if(!unique.some(t => t.id === s.type_id)) unique.push(s.type); });

    return (
      <View className="p-5 mb-4">
        {unique.map((type, i) => {
          const homeVal = stats.find(s => s.type_id === type.id && s.participant_id === homeTeam.id)?.data?.value ?? 0;
          const awayVal = stats.find(s => s.type_id === type.id && s.participant_id === awayTeam.id)?.data?.value ?? 0;

          let total = parseFloat(homeVal) + parseFloat(awayVal);
          let homePct = 50, awayPct = 50;
          if (total > 0) {
            homePct = (parseFloat(homeVal) / total) * 100;
            awayPct = (parseFloat(awayVal) / total) * 100;
          }

          return (
            <View key={i} className="mb-5">
              <Text className="text-white font-black text-xs uppercase tracking-wider text-center mb-3">{type.name}</Text>
              <View className="flex-row items-center">
                <Text className="text-white font-black text-base w-8 text-left">{homeVal}</Text>
                <View className="flex-1 h-4 bg-culos rounded-xl overflow-hidden flex-row justify-end">
                  <View className="h-full rounded-xl bg-red-600" style={{ width: `${homePct}%` }}>
                    {[...Array(8)].map((_, j) => (
                      <View key={j} className="absolute top-0 bottom-0 bg-culos"
                        style={{ left: 0, width: `${(8-j)*4}%`, opacity: j/8 }} />
                    ))}
                  </View>
                </View>
                <View className="w-1" />
                <View className="flex-1 h-4 bg-culos rounded-xl overflow-hidden">
                  <View className="h-full rounded-xl bg-yellow-400" style={{ width: `${awayPct}%` }}>
                    {[...Array(8)].map((_, j) => (
                      <View key={j} className="absolute top-0 bottom-0 bg-culos"
                        style={{ right: 0, width: `${(8-j)*4}%`, opacity: j/8 }} />
                    ))}
                  </View>
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
    const { fixture, homeTeam, awayTeam } = matchData;
    const lineups = fixture.lineups || [];
    if (!lineups.length) return <View className="bg-culos p-8 rounded-xl items-center"><Text className="text-sm font-medium text-gray-500">Susunan pemain belum dirilis.</Text></View>;

    const homeStart = lineups.filter(l => l.team_id === homeTeam.id && l.type_id === 11);
    const awayStart = lineups.filter(l => l.team_id === awayTeam.id && l.type_id === 11);
    const homeSubs = lineups.filter(l => l.team_id === homeTeam.id && l.type_id === 12);
    const awaySubs = lineups.filter(l => l.team_id === awayTeam.id && l.type_id === 12);


    const renderList = (hArr, aArr) => {
      const maxLen = Math.max(hArr.length, aArr.length);
      const rows = [];
      for (let i = 0; i < maxLen; i++) {
        const h = hArr[i], a = aArr[i];
        rows.push(
          <View key={i} className="flex-row justify-between py-2 items-center">
            <View className="flex-row items-center gap-3 w-1/2 px-2">
              {h && (
                <>
                  <Image 
                    source={{ uri: h.player?.image_path }} 
                    className="w-8 h-8 rounded-full bg-white/10" 
                  />
                  <Text className="font-semibold text-gray-200 text-xs flex-1" numberOfLines={1}>
                    {h.player_name}
                  </Text>
                </>
              )}
            </View>

            {/* Sisi Away */}
            <View className="flex-row items-center gap-3 w-1/2 px-2 justify-end">
              {a && (
                <>
                  <Text className="font-semibold text-gray-200 text-xs text-right flex-1" numberOfLines={1}>
                    {a.player_name}
                  </Text>
                  <Image 
                    source={{ uri: a.player?.image_path }} 
                    className="w-8 h-8 rounded-full bg-white/10" 
                  />
                </>
              )}
            </View>
          </View>
        );
      }
      return rows;
    };

    return (
      <View className="space-y-4 mb-8">
        <Text className="text-xs font-bold text-white uppercase traking-wider pb-3 text-center mb-1">Starting Elevent</Text>
          <View className="bg-culos shadow-sm rounded-xl p-4 mb-4">
            {renderList(homeStart, awayStart)}
          </View>
        <Text className="text-xs font-bold text-white uppercase traking-wider pb-3 text-center mb-1">Cadangan</Text>
          <View className="bg-culos shadow-sm rounded-xl p-4">
            {renderList(homeSubs, awaySubs)}
          </View>
      </View>
    );
  };


  return (
    <View className="flex-1 bg-equd">
      
      {/* FIX 3 & 4: Pakai ImageBackground dan panggil uri dari matchData.venueImg */}
      <ImageBackground 
        source={{ uri: matchData?.venueImg }} 
        style={{ paddingTop: 16, paddingBottom: 32 }}
        imageStyle={{ opacity: 0.2 }} // Opacity diturunin biar background gelap dan teks skor tetep jelas
        className="relative z-10 bg-equd"
      >
        <View className="max-w-2xl mx-auto px-4 w-full">
          <View className="flex-row items-center justify-start mb-6">
            <TouchableOpacity onPress={goBack} className="p-2 -ml-2 bg-black/30 rounded-full">
              <Svg width={20} height={20} color="white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
          </View>

          {loading || !matchData ? (
             <View className="py-8 flex-row items-center justify-between px-2">
                <View className="items-center w-[35%]"><View className="w-12 h-12 bg-gray-800 rounded-full mb-2"/><View className="w-24 h-4 bg-gray-800 rounded"/></View>
                <View className="items-center w-[30%]"><View className="w-16 h-8 bg-gray-800 rounded mb-2"/><View className="w-20 h-6 bg-gray-800 rounded-full"/></View>
                <View className="items-center w-[35%]"><View className="w-12 h-12 bg-gray-800 rounded-full mb-2"/><View className="w-24 h-4 bg-gray-800 rounded"/></View>
             </View>
          ) : (
            <View className="flex-row items-center justify-between px-2">
              <View className="items-center w-[35%]">
                <Image source={{ uri: matchData.homeTeam.image_path || 'https://placehold.co/60' }} className="w-12 h-12 mb-2" resizeMode="contain" />
                <Text className="text-[13px] font-bold text-white text-center leading-snug">{matchData.homeTeam.name}</Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className="text-4xl font-black tracking-wider text-white mb-2">{matchData.homeScore} - {matchData.awayScore}</Text>
                <Text className="text-[10px] font-bold text-merah bg-white px-3 py-1.5 rounded-full shadow-sm tracking-wide uppercase">{matchData.statusLabel}</Text>
              </View>
              <View className="items-center w-[35%]">
                <Image source={{ uri: matchData.awayTeam.image_path || 'https://placehold.co/60' }} className="w-12 h-12 mb-2" resizeMode="contain" />
                <Text className="text-[13px] font-bold text-white text-center leading-snug">{matchData.awayTeam.name}</Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
      {/* FIX 5: Hapus </LinearGradient> di sini karena udah diganti jadi ImageBackground */}

      <View className="bg-equd z-50 shadow-sm">
        {/* Sisa kode Tab ScrollView kamu di bawahnya... */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="max-w-2xl mx-auto w-full shadow-sm shadow-white py-3"
          contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row' }}
        >
          {['overview', 'events', 'stats', 'lineup'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-culos' : 'bg-white/10'}`}
            >
              <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-gray-300'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}
