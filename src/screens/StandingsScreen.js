import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { safeFetch } from '../utils/api';
import { activeSeasonIdGlobal } from './MatchesScreen';

// Daftar opsi liga populer yang bisa difilter (Bisa kamu tambah/ubah sesukanya)
const LEAGUES_LIST = [
  { id: 501, name: 'Liga Indonesia' },
  { id: 8, name: 'Premier League' },
  { id: 564, name: 'La Liga' },
  { id: 384, name: 'Serie A' },
  { id: 2, name: 'Champions League' },
  { id: 601, name: 'Ligue 1' },
];

export default function StandingsScreen({ onTeamClick }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [standings, setStandings] = useState([]);
  const [resolvedSeasonId, setResolvedSeasonId] = useState(null);
  const [error, setError] = useState(null);

  // State untuk menyimpan liga aktif yang dipilih pengguna
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES_LIST[0]);
  // State untuk mengontrol visibilitas modal popup filter liga
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    resolveAndFetch(selectedLeague.id);
  }, []);

  // Modifikasi fungsi resolve untuk menerima parameter leagueId dinamis
  const resolveAndFetch = async (leagueId) => {
    setLoading(true);
    setError(null);
    try {
      let seasonId = null;

      // Jika memilih liga utama bawaan (misal 501) dan global season tersedia, pakai global season
      if (leagueId === 501 && activeSeasonIdGlobal) {
        seasonId = activeSeasonIdGlobal;
      } else {
        // Tarik data active season terbaru secara dinamis untuk liga yang dipilih
        const leagueJson = await safeFetch(`/leagues/${leagueId}`);
        seasonId =
          leagueJson?.data?.currentSeason?.id ||
          leagueJson?.data?.current_season_id ||
          null;
      }

      if (!seasonId) {
        throw new Error('Tidak bisa mendapatkan season ID aktif liga ini');
      }

      setResolvedSeasonId(seasonId);
      await fetchStandings(seasonId);
    } catch (err) {
      setError(err.message);
      console.error('Error resolving standings:', err);
      setLoading(false);
    }
  };

  const fetchStandings = async (seasonId) => {
    try {
      const json = await safeFetch(`/standings/seasons/${seasonId}`);
      setStandings(json?.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching standings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLeague = (league) => {
    setSelectedLeague(league);
    setShowDropdown(false);
    resolveAndFetch(league.id); // Otomatis refresh data klasemen liga baru
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (resolvedSeasonId) {
      await fetchStandings(resolvedSeasonId);
    } else {
      await resolveAndFetch(selectedLeague.id);
    }
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-equd w-full">
      {/* HEADER SECTION: Judul Kiri & Filter Liga Kanan */}
      <View className="flex-row justify-between items-center px-4 pt-4 pb-3">
        <View>
          <Text className="text-2xl font-black text-white tracking-tighter mb-1">Klasemen</Text>
          <Text className="text-xs text-gray-400">{selectedLeague.name}</Text>
        </View>

        {/* Tombol Filter Liga di Pojok Kanan Atas */}
        <TouchableOpacity
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.7}
          className="bg-culos border border-white/5 px-3 py-2 rounded-xl flex-row items-center gap-2"
        >
          <Text className="text-white text-xs font-bold">Pilih Liga</Text>
          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9l6 6 6-6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* CORE CONTENT RENDER VIEW */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FC0B12" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => resolveAndFetch(selectedLeague.id)}
            className="bg-red-600 px-6 py-2 rounded-xl"
          >
            <Text className="text-white font-bold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FC0B12"
            />
          }
        >
          {/* Table Header */}
          <View className="flex-row items-center px-4 py-2 mx-4 mb-1 bg-culos rounded-xl">
            <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">#</Text>
            <Text className="flex-1 text-[10px] font-bold text-gray-400 uppercase pl-2">Tim</Text>
            <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">M</Text>
            <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">M</Text>
            <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">S</Text>
            <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">K</Text>
            <Text className="w-10 text-center text-[10px] font-bold text-gray-400 uppercase">Poin</Text>
          </View>

          {/* Table Rows */}
          <View className="px-4 pb-24">
            {standings.length === 0 ? (
              <Text className="text-gray-400 text-center py-10">Belum ada data klasemen</Text>
            ) : (
              standings.map((item, index) => {
                const team = item.participant || {};
                const details = Array.isArray(item.details) ? item.details : [];
                
                const won =
                  details.find((d) => d.type?.code === 'wins' || d.type?.name?.toLowerCase().includes('won'))?.value ??
                  item.won ?? '-';
                const draw =
                  details.find((d) => d.type?.code === 'draws' || d.type?.name?.toLowerCase().includes('draw'))?.value ??
                  item.draw ?? '-';
                const lost =
                  details.find((d) => d.type?.code === 'lost' || d.type?.name?.toLowerCase().includes('lost'))?.value ??
                  item.lost ?? '-';
                const played =
                  details.find((d) => d.type?.code === 'matches_played' || d.type?.name?.toLowerCase().includes('played'))?.value ??
                  item.games_played ?? '-';

                return (
                  <TouchableOpacity
                    key={item.id || index}
                    onPress={() => onTeamClick && onTeamClick(item.participant_id)}
                    className="bg-culos rounded-xl px-4 py-3 mb-2 flex-row items-center"
                    activeOpacity={0.75}
                  >
                    <Text className="text-gray-400 text-xs font-bold w-8 text-center">
                      {item.position || index + 1}
                    </Text>
                    <View className="flex-row items-center flex-1 gap-2 pl-1">
                      {team.image_path ? (
                        <Image
                          source={{ uri: team.image_path }}
                          className="w-6 h-6"
                          resizeMode="contain"
                        />
                      ) : null}
                      <Text className="text-white text-sm font-semibold flex-1" numberOfLines={1}>
                        {team.name || 'Tim'}
                      </Text>
                    </View>
                    <Text className="text-gray-300 text-xs w-8 text-center">{played}</Text>
                    <Text className="text-gray-300 text-xs w-8 text-center">{won}</Text>
                    <Text className="text-gray-300 text-xs w-8 text-center">{draw}</Text>
                    <Text className="text-gray-300 text-xs w-8 text-center">{lost}</Text>
                    <Text className="text-white font-black text-sm w-10 text-center">
                      {item.points ?? '-'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* MODAL POPUP SELECTION DRAWER (Premium Dark Overlay) */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        {/* Backdrop background hitam transparan transisi */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
          className="flex-1 bg-black/70 justify-center items-center px-6"
        >
          {/* Card Box Container Dropdown */}
          <View className="w-full bg-culos rounded-2xl border border-white/10 overflow-hidden py-2 max-h-[70%]">
            <View className="px-4 py-3 border-b border-white/5">
              <Text className="text-white text-base font-black">Pilih Kompetisi Liga</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {LEAGUES_LIST.map((league) => {
                const isSelected = selectedLeague.id === league.id;
                return (
                  <TouchableOpacity
                    key={league.id}
                    onPress={() => handleSelectLeague(league)}
                    className={`px-4 py-3.5 flex-row justify-between items-center ${
                      isSelected ? 'bg-white/5' : ''
                    }`}
                  >
                    <Text className={`text-sm ${isSelected ? 'text-green-400 font-bold' : 'text-gray-200'}`}>
                      {league.name}
                    </Text>
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
