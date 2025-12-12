# How to design a PLL?
PLL(Phase-locked-loop)即锁相环，是我接触到的第一个模拟器件。  
其应用有：
- 频率合成
- 相位调整
- 时钟提取
  
# PLL的结构分类
根据PFD输出的是电压还是电流信号，PLL可以分为两类：
- Ⅰ型：
- Ⅱ型：

# PFD

# Loop Filter

# VCO
可以基于输出的波形分为：
- 正弦波VCO
- 非正弦波VCO   
  
也可以粗略地分为：
- 环形VCO
- LC型VCO  
  
压控灵敏度的表达式为：
$$ K_0 = \frac{f_{0B} - f_{0A}}{V_{CB} - V_{CA}} $$
  
VCO在没有控制电压时也可以自由震荡：     

$$ \omega_o(t) = \omega_C + \Delta\omega = \omega_C + K_0V_c（t）$$
# Prescaler
整数分频器有如下种类
- 双模分频器（Dual Modulus Prescaler）
- 单模分频器（Single Modulus Prescaler）  

单模即固定的单一分频比N；   
双模则有两个分频比N/N+1，先工作在N+1下S次，再工作在N下P-S次，最终等效分频比为：
$$ M = (N+1)*S+N*(P-S)=P*N+S,P>S $$

# Fractional Clock Divider
不论是单模还是双模，其最终实现效果都是通过一个整倍数N，实现从低频$f_r$到高频$f_o=Nf_r$  
这里会出现一个鉴相频率与分辨率之间的*TradeOff*    
如果想要提高分辨率（步进频率），则会降低$f_r$，造成：    
1. **锁相环锁定时间变长，动态响应变慢** 
   - PLL的锁定时间与环路带宽$B_L$成反比，而环路带宽与参考频率$f_r$成正相关。 
2. **相位噪声恶化，输出信号纯度降低**

