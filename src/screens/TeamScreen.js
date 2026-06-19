
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  TextInput
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { safeFetch } from '../utils/api';

// --- Icon SVG ---
const MapPinIcon = ({ size = 12, color = "#9ca3af" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ChevronLeftIcon = () => (
  <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <Path d="M15 19l-7-7 7-7" />
  </Svg>
);                                                                                                                                                

const SearchIcon = ({ size = 16, color = "#9ca3af" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </Svg>
);

export default function TeamScreen({ teamId: initialTeamId, goBack }) {                                                                           
  // HELPER: Validasi ID ketat agar string "undefined", undefined, atau null tidak lolos
  const getValidId = (id) => {
    if (!id || id === 'undefined' || id === undefined || id === null) return null;
    return id;
  };

  const [selectedTeamId, setSelectedTeamId] = useState(getValidId(initialTeamId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Detail Tim & Skuad
  const [teamInfo, setTeamInfo] = useState({});
  const [squadPositions, setSquadPositions] = useState([]);

  // State Mode Pencarian Tim 
  const [searchTeams, setSearchTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sinkronisasi state lokal jika props teamId berubah
  useEffect(() => {
    setSelectedTeamId(getValidId(initialTeamId));
  }, [initialTeamId]);

  // Efek Utama: Tentukan apakah harus muat list tim liga ATAU detail satu tim
useEffect(() => {
  if (selectedTeamId) {
    loadTeamAndSquadData(selectedTeamId);
  } else {
    setLoading(false);
  }
}, [selectedTeamId]);
  // Efek Debounce Pencarian API Backend (Jalan kalau minimal ketik 3 huruf)
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length >= 3 && !selectedTeamId) {
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        try {
          const json = await safeFetch(`/teams/search/${query}`);
          setSearchTeams(json?.data || []);
        } catch (e) {
          console.error('Search BE error:', e);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchTeams([]);
    }
  }, [searchQuery, selectedTeamId]);


  // 2. Fungsi muat data spesifik SATU TIM & skuad pemainnya
  const loadTeamAndSquadData = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
const [teamJson, squadJson] = await Promise.all([
  safeFetch(`/teams/${id}`),
  safeFetch(`/squads/teams/${id}`),
]);
      const tData = teamJson?.data || teamJson || {};                                                                                                         
      const playersData = squadJson?.data || squadJson || [];

      setTeamInfo({
        name: tData.name || 'Nama Tim',
        logo: tData.image_path || 'https://placehold.co/80',
        venue: tData.venue?.name || null,
        venueImg: tData.venue?.image_path || null,
      });

      if (playersData.length === 0) {
        setSquadPositions([]);
      } else {
        const positionMap = new Map();
        playersData.forEach((item) => {
          const player = item.player || item; // Handle nested player object just in case
          if (!player || !player.name) return;
          const posName = player.position?.name || 'Lainnya';
          if (!positionMap.has(posName)) positionMap.set(posName, []);
          positionMap.get(posName).push(item);
        });

        const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
        const sortedPositions = Array.from(positionMap.keys())
          .sort((a, b) => {
            let idxA = posOrder.indexOf(a); let idxB = posOrder.indexOf(b);
            if (idxA === -1) idxA = 999; if (idxB === -1) idxB = 999;
            return idxA - idxB;
          })
          .map((pos) => ({ name: pos, players: positionMap.get(pos) }));

        setSquadPositions(sortedPositions);
      }
    } catch (e) {
      console.error('TeamScreen error:', e);
      setError(e.message || 'Gagal memuat data tim');
      setSquadPositions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (getValidId(initialTeamId)) {
      goBack();
    } else if (selectedTeamId) {
      setSelectedTeamId(null);
    } else {
      if (goBack) goBack();
    }
  };

  // Logic Penentu Grid Tampilan
const displayedTeams = searchTeams;
  // --- RENDER ERROR STATE ---
  if (!loading && error) {
    return (
      <View className="flex-1 bg-equd items-center justify-center px-6">
        <TouchableOpacity onPress={handleBack} className="absolute top-12 left-6 p-3 bg-white/5 rounded-full"><ChevronLeftIcon /></TouchableOpacity>
        <Text className="text-gray-400 text-center mb-6">{error}</Text>
<TouchableOpacity
  onPress={() => {
    if (selectedTeamId) {
      loadTeamAndSquadData(selectedTeamId);
    }
  }}
  className="bg-red-600 px-8 py-3 rounded-full"
>
          <Text className="text-white font-bold text-xs uppercase tracking-wider">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- MODE A: TAMPILKAN LIST & SEARCH BAR ---
  if (!selectedTeamId) {
    return (
      <View className="flex-1 bg-equd w-full pt-12">
        <View className="px-5 mb-4">
          <Text className="text-xl font-black text-white uppercase tracking-wider mb-3">Cari Skuad Tim</Text>
          <View className="flex-row items-center bg-culos rounded-xl px-4 py-2.5 border border-white/5">
            <SearchIcon />
            <TextInput
              placeholder="Ketik nama klub favorit..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white text-xs font-semibold ml-3 p-0 h-6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isSearching && <ActivityIndicator size="small" color="#FC0B12" />}
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#FC0B12" /></View>
        ) : (
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {displayedTeams.length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-gray-500 font-medium text-xs">
                  {isSearching ? 'Mencari klub...' : 'Tim tidak ditemukan.'}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between pb-10 mt-2">
                {displayedTeams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    onPress={() => setSelectedTeamId(team.id)}
                    activeOpacity={0.7}
                    className="w-[48%] bg-culos p-4 rounded-2xl items-center mb-4 shadow-sm border border-white/5"
                  >
                    <View className="w-16 h-16 bg-white/5 rounded-full items-center justify-center mb-3 p-2">
                      <Image source={{ uri: team.image_path || 'https://placehold.co/60' }} className="w-full h-full" resizeMode="contain" />
                    </View>
                    <Text className="text-xs font-black text-white text-center uppercase tracking-wide" numberOfLines={1}>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // --- MODE B: TAMPILKAN DETAIL PROFIL SKUAD TIM ---
  return (
    <View className="flex-1 bg-equd w-full">
      <ImageBackground source={teamInfo.venueImg ? { uri: teamInfo.venueImg } : undefined} className="relative z-10 bg-equd pt-12 pb-8 border-b border-white/5">
        <View className="absolute inset-0 bg-equd/90" />
        <View className="px-6 relative z-20">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center mb-6"><ChevronLeftIcon /></TouchableOpacity>
          <View className="items-center">
            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4 p-2 shadow-lg">
              <Image source={{ uri: teamInfo.logo }} className="w-full h-full" resizeMode="contain" />
            </View>
            <Text className="text-2xl font-black text-white uppercase tracking-wider text-center">{teamInfo.name}</Text>
            {teamInfo.venue && (
              <View className="flex-row items-center gap-1.5 mt-2 bg-white/5 px-3 py-1.5 rounded-full">
                <MapPinIcon />
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{teamInfo.venue}</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>

      <ScrollView className="flex-1 w-full p-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16"><ActivityIndicator size="large" color="#FC0B12" /></View>
        ) : squadPositions.length === 0 ? (
          <View className="items-center py-16"><Text className="text-gray-500 font-medium text-xs">Belum ada data pemain.</Text></View>
        ) : (
          <View className="pb-8">
            {squadPositions.map((posGrp, idx) => (
              <View key={idx} className="mb-6">
                <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2">{posGrp.name}</Text>
                <View className="bg-culos rounded-2xl overflow-hidden shadow-sm">
                  {posGrp.players.map((item, pIdx) => {
                    const player = item.player || item;
                    let age = '-';
                    if (player.date_of_birth) {
                      const birthDate = new Date(player.date_of_birth);
                      const today = new Date();
                      age = today.getFullYear() - birthDate.getFullYear();
                      if (today.getMonth() - birthDate.getMonth() < 0 || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
                    }
                    return (
                      <View key={pIdx} className={`flex-row items-center px-5 py-3 ${pIdx !== posGrp.players.length - 1 ? 'border-b border-white/5' : ''}`}>
                        <View className="w-10 h-10 rounded-full bg-white/5 overflow-hidden mr-4">
                          <Image source={{ uri: player.image_path || 'https://placehold.co/40' }} className="w-full h-full" resizeMode="cover" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-white mb-0.5" numberOfLines={1}>{player.name || 'Tidak diketahui'}</Text>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-[10px] font-medium text-gray-400">Umur {age}</Text>
                            {player.nationality && (
                              <View className="flex-row items-center gap-1.5 border-l border-white/10 pl-2">
                                <Image source={{ uri: player.nationality.image_path }} className="w-3.5 h-2.5 rounded-sm" resizeMode="cover" />
                                <Text className="text-[10px] font-medium text-gray-400" numberOfLines={1}>{player.nationality.name}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
