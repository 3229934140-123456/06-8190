import { useState } from 'react';
import {
  Settings,
  RotateCcw,
  ShieldCheck,
  Clock,
  Star,
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  UserPlus,
  Package,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { USER_ROLE_LABEL, type UserRole } from '@/types';

type TabKey = 'return' | 'warranty' | 'courier' | 'permission';

interface ReturnRule {
  id: string;
  name: string;
  description: string;
  days: number;
  enabled: boolean;
  category: string;
}

interface WarrantyConfig {
  id: string;
  category: string;
  months: number;
  depreciationRate: number;
  extendedAvailable: boolean;
  extendedMonths: number;
}

interface CourierWeight {
  id: string;
  courierName: string;
  efficiency: number;
  cost: number;
  overall: number;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLoginAt: string;
  createdAt: string;
}

const initialReturnRules: ReturnRule[] = [
  { id: '1', name: '7天无理由退货', description: '商品签收后7天内可无理由退货', days: 7, enabled: true, category: '全部品类' },
  { id: '2', name: '质量问题30天包退', description: '存在质量问题30天内可退货', days: 30, enabled: true, category: '全部品类' },
  { id: '3', name: '特殊商品不支持退货', description: '定制、贴身等特殊商品不支持退货', days: 0, enabled: true, category: '定制/贴身商品' },
  { id: '4', name: '生鲜食品48小时退换', description: '生鲜食品签收后48小时内可退换', days: 2, enabled: true, category: '食品生鲜' },
];

const initialWarranties: WarrantyConfig[] = [
  { id: '1', category: '手机数码', months: 12, depreciationRate: 0.05, extendedAvailable: true, extendedMonths: 12 },
  { id: '2', category: '家用电器', months: 24, depreciationRate: 0.03, extendedAvailable: true, extendedMonths: 24 },
  { id: '3', category: '服装鞋帽', months: 3, depreciationRate: 0.10, extendedAvailable: false, extendedMonths: 0 },
  { id: '4', category: '美妆护肤', months: 6, depreciationRate: 0.08, extendedAvailable: false, extendedMonths: 0 },
  { id: '5', category: '家居用品', months: 12, depreciationRate: 0.04, extendedAvailable: true, extendedMonths: 12 },
];

const initialCourierWeights: CourierWeight[] = [
  { id: '1', courierName: '顺丰速运', efficiency: 50, cost: 50, overall: 50 },
  { id: '2', courierName: '京东物流', efficiency: 45, cost: 55, overall: 50 },
  { id: '3', courierName: '圆通速递', efficiency: 40, cost: 60, overall: 50 },
  { id: '4', courierName: '中通快递', efficiency: 40, cost: 60, overall: 50 },
  { id: '5', courierName: '韵达快递', efficiency: 35, cost: 65, overall: 50 },
  { id: '6', courierName: '德邦快递', efficiency: 45, cost: 55, overall: 50 },
  { id: '7', courierName: '邮政EMS', efficiency: 30, cost: 70, overall: 50 },
];

const initialUsers: SystemUser[] = [
  { id: '1', username: 'admin', name: '系统管理员', email: 'admin@company.com', phone: '13800138000', role: 'admin', status: 'active', lastLoginAt: '2026-06-16 09:30:00', createdAt: '2026-01-01 00:00:00' },
  { id: '2', username: 'zhangsan', name: '张经理', email: 'zhangsan@company.com', phone: '13800138001', role: 'after_sales', status: 'active', lastLoginAt: '2026-06-16 08:45:00', createdAt: '2026-01-15 10:00:00' },
  { id: '3', username: 'lisi', name: '李主管', email: 'lisi@company.com', phone: '13800138002', role: 'warehouse', status: 'active', lastLoginAt: '2026-06-15 17:20:00', createdAt: '2026-02-01 09:00:00' },
  { id: '4', username: 'wangwu', name: '王专员', email: 'wangwu@company.com', phone: '13800138003', role: 'customer_service', status: 'active', lastLoginAt: '2026-06-16 10:15:00', createdAt: '2026-03-01 14:00:00' },
  { id: '5', username: 'liuliu', name: '刘财务', email: 'liuliu@company.com', phone: '13800138004', role: 'finance', status: 'active', lastLoginAt: '2026-06-14 16:00:00', createdAt: '2026-04-01 11:00:00' },
  { id: '6', username: 'zhaoliu', name: '赵客服', email: 'zhaoliu@company.com', phone: '13800138005', role: 'customer_service', status: 'inactive', lastLoginAt: '2026-05-20 09:00:00', createdAt: '2026-05-01 10:00:00' },
];

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/30',
  after_sales: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  warehouse: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  customer_service: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('return');
  const [returnRules, setReturnRules] = useState<ReturnRule[]>(initialReturnRules);
  const [warranties, setWarranties] = useState<WarrantyConfig[]>(initialWarranties);
  const [courierWeights, setCourierWeights] = useState<CourierWeight[]>(initialCourierWeights);
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [saved, setSaved] = useState<string | null>(null);

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'return', label: '退货规则配置', icon: Package },
    { key: 'warranty', label: '保修期配置', icon: CalendarDays },
    { key: 'courier', label: '快递评分权重', icon: Star },
    { key: 'permission', label: '用户权限管理', icon: Users }
  ];

  const handleSave = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  };

  const toggleReturnRule = (id: string) => {
    setReturnRules(returnRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)));
  };

  const updateCourierWeight = (id: string, field: 'efficiency' | 'cost' | 'overall', value: number) => {
    setCourierWeights(courierWeights.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">系统设置</h1>
            <p className="text-sm text-slate-400">配置系统规则、保修期、快递评分及用户权限</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(activeTab)}
            className="btn-primary flex items-center gap-2"
          >
            {saved === activeTab ? (
              <>
                <Check className="h-4 w-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-dark-700 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  activeTab === tab.key
                    ? 'bg-primary-500/20 text-primary-400 shadow-inner'
                    : 'text-slate-400 hover:bg-dark-700/50 hover:text-slate-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'return' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">退货规则配置</h3>
                  <p className="mt-1 text-sm text-slate-400">管理不同品类商品的退货时限与规则</p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新增规则
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {returnRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={cn(
                      'rounded-xl border p-5 transition-all duration-200',
                      rule.enabled
                        ? 'border-dark-700 bg-dark-900/50 hover:border-primary-500/30'
                        : 'border-dark-700/50 bg-dark-900/20 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{rule.name}</h4>
                        <p className="mt-1 text-sm text-slate-400">{rule.description}</p>
                      </div>
                      <button
                        onClick={() => toggleReturnRule(rule.id)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors duration-200',
                          rule.enabled ? 'bg-primary-500' : 'bg-dark-600'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
                            rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-dark-800/80 px-3 py-2">
                        <div className="text-xs text-slate-500">适用品类</div>
                        <div className="mt-0.5 text-sm text-slate-200">{rule.category}</div>
                      </div>
                      <div className="rounded-lg bg-dark-800/80 px-3 py-2">
                        <div className="text-xs text-slate-500">退货时限</div>
                        <div className="mt-0.5 text-sm text-slate-200">
                          {rule.days > 0 ? `${rule.days} 天` : '不支持'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 text-slate-400 transition-all hover:border-primary-500/50 hover:text-primary-400">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 text-slate-400 transition-all hover:border-red-500/50 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">保修期配置</h3>
                  <p className="mt-1 text-sm text-slate-400">配置各品类商品的保修时长与折旧率</p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新增配置
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-dark-700">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">商品品类</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">保修时长</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">年折旧率</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">延保服务</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">延保时长</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {warranties.map((w) => (
                      <tr key={w.id} className="transition-colors hover:bg-dark-700/30">
                        <td className="px-4 py-3 text-sm font-medium text-white">{w.category}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary-400" />
                            <span className="text-sm text-slate-200">{w.months} 个月</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-200">{(w.depreciationRate * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          {w.extendedAvailable ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              <ShieldCheck className="h-3 w-3" />
                              支持
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-400">
                              不支持
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-200">
                          {w.extendedAvailable ? `${w.extendedMonths} 个月` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 text-slate-400 transition-all hover:border-primary-500/50 hover:text-primary-400">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courier' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">快递评分权重配置</h3>
                <p className="mt-1 text-sm text-slate-400">
                  调整效率、成本在综合评分中的权重占比（效率 + 成本 = 100%）
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-5">
                  <div className="text-sm font-medium text-white">全局权重配置</div>
                  <p className="mt-1 text-xs text-slate-500">统一应用于所有快递公司</p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-slate-300">效率权重</span>
                        <span className="text-sm font-semibold text-blue-400">50%</span>
                      </div>
                      <input type="range" min={0} max={100} defaultValue={50} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-slate-300">成本权重</span>
                        <span className="text-sm font-semibold text-yellow-400">50%</span>
                      </div>
                      <input type="range" min={0} max={100} defaultValue={50} className="w-full accent-yellow-500" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-xl border border-dark-700 bg-dark-900/50 p-5">
                  <div className="text-sm font-medium text-white">各快递公司评分</div>
                  <p className="mt-1 text-xs text-slate-500">手动调整各公司的效率与成本评分</p>
                  <div className="mt-5 space-y-4">
                    {courierWeights.slice(0, 4).map((courier) => (
                      <div key={courier.id} className="rounded-lg bg-dark-800/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-medium text-white">{courier.courierName}</span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                            综合 {courier.overall}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs text-slate-400">效率评分</span>
                              <span className="text-xs text-blue-400">{courier.efficiency}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={courier.efficiency}
                              onChange={(e) => updateCourierWeight(courier.id, 'efficiency', Number(e.target.value))}
                              className="w-full accent-blue-500"
                            />
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs text-slate-400">成本评分</span>
                              <span className="text-xs text-yellow-400">{courier.cost}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={courier.cost}
                              onChange={(e) => updateCourierWeight(courier.id, 'cost', Number(e.target.value))}
                              className="w-full accent-yellow-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permission' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">用户权限管理</h3>
                  <p className="mt-1 text-sm text-slate-400">管理系统用户账号与角色权限</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  新增用户
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-dark-700">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">用户信息</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">联系方式</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">角色权限</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">最后登录</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {users.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-dark-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/20 text-sm font-semibold text-primary-400">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{user.name}</div>
                              <div className="text-xs text-slate-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">{user.email}</div>
                          <div className="text-xs text-slate-500">{user.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                              roleBadgeColor[user.role]
                            )}
                          >
                            {USER_ROLE_LABEL[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={cn(
                              'relative h-6 w-11 rounded-full transition-colors duration-200',
                              user.status === 'active' ? 'bg-emerald-500' : 'bg-dark-600'
                            )}
                          >
                            <span
                              className={cn(
                                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
                                user.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'
                              )}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{user.lastLoginAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 text-slate-400 transition-all hover:border-primary-500/50 hover:text-primary-400">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 text-slate-400 transition-all hover:border-red-500/50 hover:text-red-400">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
