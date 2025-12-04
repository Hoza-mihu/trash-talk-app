'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Recycle, BarChart3, Leaf, TrendingDown, Award, Globe, ArrowLeft, Calendar, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  CATEGORY_COLORS,
  CATEGORY_KEYS,
  type UserStats,
  type WasteCategoryKey,
  createDefaultUserStats,
  mergeWithDefaultStats,
  HISTORICAL_STATS,
  combineStats
} from '@/lib/stats';
import { useAuth } from '@/context/AuthContext';
import { getUserStats } from '@/lib/utils';
import { calculateEnvironmentalImpact } from '@/lib/environmental-impact';

interface AchievementLevel {
  id: string;
  title: string;
  emoji: string;
  threshold: number;
  description: string;
}

const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  { id: 'seed', title: 'Eco Seed', emoji: '🌱', threshold: 0, description: 'Started your recycling journey' },
  { id: 'sprout', title: 'Eco Sprout', emoji: '🍀', threshold: 5, description: 'Classified five items' },
  { id: 'beginner', title: 'Eco Beginner', emoji: '🌿', threshold: 10, description: 'Reached double digits' },
  { id: 'enthusiast', title: 'Eco Enthusiast', emoji: '🌳', threshold: 20, description: 'Consistent recycler' },
  { id: 'champion', title: 'Eco Champion', emoji: '🏆', threshold: 50, description: 'Community role model' },
  { id: 'guardian', title: 'Eco Guardian', emoji: '🛡️', threshold: 100, description: 'Defender of the planet' },
  { id: 'legend', title: 'Eco Legend', emoji: '👑', threshold: 200, description: 'Ultimate waste warrior' }
];

const getAchievementDetails = (totalItems: number) => {
  let current = ACHIEVEMENT_LEVELS[0];
  for (const level of ACHIEVEMENT_LEVELS) {
    if (totalItems >= level.threshold) {
      current = level;
    }
  }

  const next = ACHIEVEMENT_LEVELS.find((level) => level.threshold > current.threshold);
  const progressPercent = next
    ? Math.min(100, Math.max(0, ((totalItems - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  return {
    current,
    next,
    progressPercent,
    progressLabel: next ? `${totalItems} / ${next.threshold} items` : `${totalItems} items`,
    hasMaxedOut: !next
  };
};

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserStats>(createDefaultUserStats());
  const [showAchievements, setShowAchievements] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setStatsLoading(true);
      setStatsError(null);

      const cacheKey = `userStats_${user.uid}`;
      let fallbackStats = createDefaultUserStats();

      // Load cached stats immediately for snappier UI
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        fallbackStats = mergeWithDefaultStats(JSON.parse(cached));
        setUserData(fallbackStats);
      }

      try {
        const stats = await getUserStats(user.uid);
        if (stats) {
          const mergedStats =
            stats.totalItems >= fallbackStats.totalItems ? stats : fallbackStats;

          if (stats.totalItems < fallbackStats.totalItems) {
            console.warn(
              'Firestore stats are behind local cache, keeping local totals until sync completes.'
            );
          }

          setUserData(mergedStats);
          localStorage.setItem(cacheKey, JSON.stringify(mergedStats));
        } else {
          setUserData(fallbackStats);
          if (!cached) {
            setStatsError('No analysis history yet. Analyze an item to get started.');
          }
        }
      } catch (error) {
        console.error('Failed to load stats', error);
        setStatsError('Unable to load your latest stats, showing cached data.');
        setUserData(fallbackStats);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    color: 'green' | 'blue' | 'orange' | 'purple';
    subtitle?: string;
  }

  const StatCard = ({ icon: Icon, label, value, color, subtitle }: StatCardProps) => {
    const colorClasses = {
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600'
      },
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600'
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-600'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600'
      }
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.green;

    return (
      <div 
        className={`group bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 transform ${
          isVisible[`stat-${label}`] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
        id={`stat-${label}`}
        ref={(el) => { sectionRefs.current[`stat-${label}`] = el; }}
        onMouseEnter={() => setHoveredCard(`stat-${label}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
            hoveredCard === `stat-${label}` ? 'shadow-lg' : ''
          }`}>
            <Icon className={`w-6 h-6 ${colors.text} transition-transform duration-500 ${
              hoveredCard === `stat-${label}` ? 'scale-110' : ''
            }`} />
          </div>
          <span className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition-colors">{label}</span>
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{subtitle}</p>}
      </div>
    );
  };

  const achievementInfo = getAchievementDetails(userData.totalItems);

  const globalStats = combineStats(userData, HISTORICAL_STATS);

  const co2ChartData = CATEGORY_KEYS.map((key) => ({
    name: key,
    co2: Number(globalStats.categories[key].co2.toFixed(2))
  }));

  const wasteDistributionData = CATEGORY_KEYS.map((key) => ({
    name: key,
    value: globalStats.categories[key].count,
    color: CATEGORY_COLORS[key]
  })).filter((entry) => entry.value > 0);

  const hasCo2Data = co2ChartData.some((entry) => entry.co2 > 0);
  const hasDistributionData = wasteDistributionData.length > 0;

  const visibleLegendKeys = CATEGORY_KEYS.filter(
    (key) => key !== 'Other' || globalStats.categories.Other.count > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-teal-400/10 to-green-400/10 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-300/20 rounded-full blur-2xl animate-float-bubble"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-teal-300/20 rounded-full blur-2xl animate-float-bubble" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-green-400/20 rounded-full blur-2xl animate-float-bubble" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Eco-Eco</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* Header */}
        <div 
          className="mb-8"
          id="header"
          ref={(el) => { sectionRefs.current['header'] = el; }}
        >
          <h1 className={`text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent transition-all duration-700 ${
            isVisible['header'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            Your Impact Dashboard
          </h1>
          <p className={`text-gray-600 text-lg flex items-center gap-2 transition-all duration-700 ${
            isVisible['header'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`} style={{ transitionDelay: '0.1s' }}>
            <Calendar className="w-5 h-5 animate-pulse-light" />
            Track your environmental contribution over time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-4">
          <StatCard 
            icon={Recycle} 
            label="Total Items Analyzed" 
            value={userData.totalItems} 
            color="green"
            subtitle="Keep it up!"
          />
          <StatCard 
            icon={BarChart3} 
            label="Recyclable Items" 
            value={userData.recyclableItems} 
            color="blue"
            subtitle={`${userData.totalItems ? Math.round((userData.recyclableItems / userData.totalItems) * 100) : 0}% of total`}
          />
          <StatCard 
            icon={Leaf} 
            label="Compostable Items" 
            value={userData.compostableItems} 
            color="orange"
            subtitle={`${userData.totalItems ? Math.round((userData.compostableItems / userData.totalItems) * 100) : 0}% of total`}
          />
          <StatCard 
            icon={TrendingDown} 
            label="CO₂ Saved (kg)" 
            value={userData.co2Saved.toFixed(1)} 
            color="purple"
            subtitle="Great impact!"
          />
        </div>

        {statsError && (
          <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-lg">
            {statsError}
          </p>
        )}

        {/* Data Visualizations */}
        <div 
          className={`bg-white rounded-xl p-8 shadow-lg mb-8 transition-all duration-700 hover:shadow-2xl border-2 border-transparent hover:border-green-200 transform ${
            isVisible['visualizations'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          id="visualizations"
          ref={(el) => { sectionRefs.current['visualizations'] = el; }}
        >
          <p className="text-sm text-gray-500 mb-4">
            Visuals include historical recycling totals plus your scans for a complete view of impact.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">CO₂ Savings by Category</h3>
              {hasCo2Data ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={co2ChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#374151' }}
                      tickFormatter={(value) => (value === 'Organic Waste' ? 'Organic' : value)}
                    />
                    <YAxis tick={{ fill: '#374151' }} tickFormatter={(value) => `${value}kg`} />
                    <Tooltip
                      formatter={(value: number | string) => [
                        `${Number(value).toFixed(2)} kg`,
                        'CO₂ Saved'
                      ]}
                      cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                    />
                    <Bar dataKey="co2" radius={[8, 8, 0, 0]}>
                      {co2ChartData.map((entry) => (
                        <Cell
                          key={`co2-${entry.name}`}
                          fill={CATEGORY_COLORS[entry.name as WasteCategoryKey]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center bg-gray-50 rounded-lg p-6 border border-dashed border-gray-200">
                  Analyze items to unlock your CO₂ savings insights.
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-6">
                {CATEGORY_KEYS.map((key) => (
                  <div key={`bar-legend-${key}`} className="flex items-center gap-2 text-sm text-gray-600">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[key] }}
                    ></span>
                    {key}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Waste Distribution</h3>
              {hasDistributionData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={wasteDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {wasteDistributionData.map((entry) => (
                        <Cell key={`slice-${entry.name}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string, name) => [
                        `${Number(value)} items`,
                        String(name)
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center bg-gray-50 rounded-lg p-6 border border-dashed border-gray-200">
                  No distribution data yet. Analyze a few items to populate this chart.
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {visibleLegendKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[key] }}
                    ></span>
                    {key}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Waste Breakdown */}
          <div 
            className={`bg-white rounded-xl p-8 shadow-lg transition-all duration-700 hover:shadow-2xl border-2 border-transparent hover:border-green-200 transform ${
              isVisible['waste-breakdown'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            id="waste-breakdown"
            ref={(el) => { sectionRefs.current['waste-breakdown'] = el; }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-green-600 transition-colors">Waste Breakdown</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Recyclable Items
                  </span>
                  <span className="text-sm font-bold text-gray-900">{userData.recyclableItems}</span>
                </div>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${userData.totalItems ? (userData.recyclableItems / userData.totalItems) * 100 : 0}%` }}
                  >
                    {userData.recyclableItems > 0 && (
                      <span className="text-xs text-white font-semibold">
                        {userData.totalItems ? Math.round((userData.recyclableItems / userData.totalItems) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    Compostable Items
                  </span>
                  <span className="text-sm font-bold text-gray-900">{userData.compostableItems}</span>
                </div>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${userData.totalItems ? (userData.compostableItems / userData.totalItems) * 100 : 0}%` }}
                  >
                    {userData.compostableItems > 0 && (
                      <span className="text-xs text-white font-semibold">
                        {userData.totalItems ? Math.round((userData.compostableItems / userData.totalItems) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    Other Waste
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {userData.totalItems - userData.recyclableItems - userData.compostableItems}
                  </span>
                </div>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${userData.totalItems ? ((userData.totalItems - userData.recyclableItems - userData.compostableItems) / userData.totalItems) * 100 : 0}%` }}
                  >
                    {(userData.totalItems - userData.recyclableItems - userData.compostableItems) > 0 && (
                      <span className="text-xs text-white font-semibold">
                        {userData.totalItems ? Math.round(((userData.totalItems - userData.recyclableItems - userData.compostableItems) / userData.totalItems) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Card */}
          <div 
            className={`bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-8 shadow-lg text-white transition-all duration-700 hover:shadow-2xl transform hover:scale-105 ${
              isVisible['achievement'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            id="achievement"
            ref={(el) => { sectionRefs.current['achievement'] = el; }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer animate-pulse-light">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Achievement Level</h3>
                <p className="text-green-100">Your current status</p>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                <p className="text-xl font-semibold">
                  {achievementInfo.current.emoji} {achievementInfo.current.title} - {achievementInfo.current.description}
                </p>
                <button
                  onClick={() => setShowAchievements(true)}
                  className="text-sm font-semibold text-white/90 underline decoration-dotted hover:text-white"
                >
                  View all levels
                </button>
              </div>
              <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-white transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${achievementInfo.progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm text-green-100">
                {achievementInfo.hasMaxedOut ? 'Maximum level reached!' : achievementInfo.progressLabel}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Part of a global eco-community</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  Prevented {userData.co2Saved.toFixed(1)} kg of CO₂ emissions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Recycle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  {userData.totalItems} items diverted from landfills
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Impact */}
        {(() => {
          const impact = calculateEnvironmentalImpact(userData);
          return (
            <div 
              className={`bg-white rounded-xl p-8 shadow-lg mb-8 transition-all duration-700 hover:shadow-2xl border-2 border-transparent hover:border-green-200 transform ${
                isVisible['environmental-impact'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              id="environmental-impact"
              ref={(el) => { sectionRefs.current['environmental-impact'] = el; }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-green-600 transition-colors">Your Environmental Impact</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { emoji: '🌊', value: `${impact.waterSaved.toFixed(0)} L`, label: 'Water saved through recycling', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-900', id: 'water' },
                  { emoji: '🌳', value: impact.treesEquivalent > 0 ? impact.treesEquivalent.toFixed(2) : '—', label: 'Equivalent trees planted', bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-900', id: 'trees' },
                  { emoji: '⚡', value: `${impact.energyConserved.toFixed(0)} kWh`, label: 'Energy conserved', bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-900', id: 'energy' }
                ].map((item, index) => (
                  <div 
                    key={item.id}
                    className={`text-center p-6 bg-gradient-to-br ${item.bg} rounded-xl border-2 ${item.border} transition-all duration-500 hover:scale-110 hover:shadow-xl transform group cursor-pointer`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onMouseEnter={() => setHoveredCard(`impact-${item.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`text-5xl mb-3 transition-all duration-500 ${
                      hoveredCard === `impact-${item.id}` ? 'scale-125 rotate-12' : ''
                    }`}>{item.emoji}</div>
                    <p className={`text-3xl font-bold ${item.text} mb-2 transition-all duration-500 ${
                      hoveredCard === `impact-${item.id}` ? 'scale-110' : ''
                    }`}>
                      {item.value}
                    </p>
                    <p className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Call to Action */}
        <div 
          className={`bg-gradient-to-br from-green-50 via-teal-50 to-green-50 rounded-2xl p-8 md:p-12 shadow-lg border-2 border-green-200 transition-all duration-700 hover:shadow-2xl relative overflow-hidden transform ${
            isVisible['cta'] ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
          id="cta"
          ref={(el) => { sectionRefs.current['cta'] = el; }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-300/20 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/20 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mb-4 shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer animate-pulse-light">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Keep Up the Great Work!</h3>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed">
              Every item you analyze helps build a more sustainable future. Continue your journey to make an even bigger impact!
            </p>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Join Community */}
            <Link
              href="/community"
              className="group bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Join the Community</h4>
                <p className="text-sm text-green-100">Connect with eco-warriors and share tips</p>
              </div>
            </Link>

            {/* Share Stats */}
            <Link
              href="/community/create?isTip=false"
              className="group bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Share Your Stats</h4>
                <p className="text-sm text-green-100">Showcase your recycling achievements</p>
              </div>
            </Link>

            {/* Analyze More */}
            <Link
              href="/upload"
              className="group bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Recycle className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Analyze More Items</h4>
                <p className="text-sm text-green-100">Continue your recycling journey</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Achievement Levels</h4>
                <p className="text-gray-500 text-sm">See every milestone from seed to legend</p>
              </div>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Close achievements list"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-4">
              {ACHIEVEMENT_LEVELS.map((level) => {
                const completed = userData.totalItems >= level.threshold;
                const isCurrent = level.id === achievementInfo.current.id;
                const statusLabel = completed
                  ? isCurrent && achievementInfo.hasMaxedOut
                    ? 'Legendary status'
                    : isCurrent
                      ? 'Current level'
                      : 'Completed'
                  : 'Upcoming';
                const statusColor = completed
                  ? 'text-emerald-600'
                  : 'text-gray-500';
                const borderClasses = isCurrent
                  ? 'border-2 border-emerald-400 bg-emerald-50'
                  : completed
                    ? 'border border-emerald-100 bg-emerald-50/60'
                    : 'border border-gray-200 bg-white';

                return (
                  <div key={level.id} className={`rounded-2xl p-5 flex items-start gap-4 ${borderClasses}`}>
                    <div className="text-3xl">{level.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                        <p className="text-lg font-semibold text-gray-900">{level.title}</p>
                        <span className={`text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                      <p className="text-sm text-gray-500">Requires {level.threshold} recycled items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}