import React, { useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { motion } from 'framer-motion'

const LuckyHub: React.FC = () => {
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const generateLuckyNumbers = () => {
    // Energy Pattern 기반 난수 가중치 생성
    const numbers: number[] = []
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    numbers.sort((a, b) => a - b)
    setLuckyNumbers(numbers)
  }

  const games = [
    { id: 'wave', name: '에너지 파형 맞추기', description: '파동에 맞춰 탭하여 집중력을 높이세요', icon: '🌊' },
    { id: 'balance', name: '밸런스 컨트롤', description: '에너지 게이지를 중앙에 유지하세요', icon: '⚖️' },
    { id: 'choice', name: '선택형 시뮬레이션', description: '상황을 선택하면 오늘 타입을 분석합니다', icon: '🎯' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">행운 센터</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Energy Pattern 기반 행운 번호와 미니 게임을 즐겨보세요.
        </p>
      </div>

      {/* 행운 번호 섹션 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">행운 번호 추천</h2>
        <div className="text-center">
          {luckyNumbers.length > 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center gap-3 mb-6 flex-wrap"
            >
              {luckyNumbers.map((num, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
                >
                  {num}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-12 text-gray-500">
              행운 번호를 생성해보세요!
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={generateLuckyNumbers}>
              {luckyNumbers.length > 0 ? '다시 생성' : '행운 번호 생성'}
            </Button>
            {luckyNumbers.length > 0 && (
              <>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(luckyNumbers.join(', '))}>
                  복사
                </Button>
                <Button variant="outline" onClick={() => {
                  const text = `오늘의 행운 번호: ${luckyNumbers.join(', ')}`
                  if (navigator.share) {
                    navigator.share({ text })
                  } else {
                    alert(text)
                  }
                }}>
                  공유
                </Button>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            * 본 번호는 오락용 추천이며, 실제 로또 당첨을 보장하지 않습니다.
          </p>
        </div>
      </Card>

      {/* 미니 게임 섹션 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">미니 게임</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card
              key={game.id}
              hover
              onClick={() => setSelectedGame(game.id)}
              className="cursor-pointer text-center"
            >
              <div className="text-5xl mb-4">{game.icon}</div>
              <h3 className="font-semibold mb-2">{game.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{game.description}</p>
            </Card>
          ))}
        </div>

        {selectedGame && (
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {games.find(g => g.id === selectedGame)?.name} 게임은 곧 출시될 예정입니다.
            </p>
            <Button variant="outline" onClick={() => setSelectedGame(null)}>
              닫기
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default LuckyHub
