import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type Mood = 'happy' | 'calm' | 'anxious' | 'sad' | 'stressed';

interface DiaryEntry {
  id: number;
  date: string;
  mood: Mood;
  text: string;
}

interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  message: string;
  time: string;
}

const moodConfig: Record<Mood, { icon: string; color: string; label: string }> = {
  happy: { icon: 'Smile', color: 'bg-success text-success-foreground', label: 'Радость' },
  calm: { icon: 'CloudRain', color: 'bg-accent text-accent-foreground', label: 'Спокойствие' },
  anxious: { icon: 'AlertCircle', color: 'bg-primary text-primary-foreground', label: 'Тревога' },
  sad: { icon: 'Frown', color: 'bg-secondary text-secondary-foreground', label: 'Грусть' },
  stressed: { icon: 'Zap', color: 'bg-destructive text-destructive-foreground', label: 'Стресс' }
};

const API_URL = 'https://functions.poehali.dev/cb4214ae-b9b8-415c-8d30-7443f34a3097';

export default function Index() {
  const [currentMood, setCurrentMood] = useState<Mood>('calm');
  const [diaryText, setDiaryText] = useState('');
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    loadDiaryEntries();
  }, []);

  const loadDiaryEntries = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': '1'
        }
      });
      const data = await response.json();
      if (data.entries) {
        setDiaryEntries(data.entries);
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    }
  };

  const saveDiaryEntry = async () => {
    if (!diaryText.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          mood: currentMood,
          text: diaryText
        })
      });

      if (response.ok) {
        setDiaryText('');
        await loadDiaryEntries();
      }
    } catch (error) {
      console.error('Ошибка сохранения записи:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const [chatMessages] = useState<ChatMessage[]>([
    { id: 1, user: 'Анна', avatar: 'A', message: 'Девочки, как справляетесь с тревожностью? Последнее время очень накрыло', time: '14:23' },
    { id: 2, user: 'Мария', avatar: 'M', message: 'Анна, попробуй дыхательные техники! Мне очень помогают', time: '14:25' },
    { id: 3, user: 'Елена', avatar: 'E', message: 'Поддерживаю! А еще записывать мысли в дневник - отличная практика', time: '14:27' }
  ]);

  const [affirmations] = useState([
    'Я достойна любви и уважения',
    'Я контролирую свои эмоции',
    'Каждый день я становлюсь сильнее',
    'Я заслуживаю счастья'
  ]);

  const handleBreathExercise = () => {
    if (!isBreathing) {
      setIsBreathing(true);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setBreathCount(count);
        if (count >= 6) {
          clearInterval(interval);
          setIsBreathing(false);
          setBreathCount(0);
        }
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-primary">Моя Поддержка</h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Icon name="Bell" size={20} />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">Я</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="diary" className="gap-2">
              <Icon name="BookOpen" size={16} />
              <span className="hidden sm:inline">Дневник</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <Icon name="MessageCircle" size={16} />
              <span className="hidden sm:inline">Чат</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Icon name="Heart" size={16} />
              <span className="hidden sm:inline">Практики</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Icon name="TrendingUp" size={16} />
              <span className="hidden sm:inline">Прогресс</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Icon name="Users" size={16} />
              <span className="hidden sm:inline">Истории</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Как ты себя чувствуешь сегодня?</CardTitle>
                <CardDescription>Выбери свое настроение и запиши мысли</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3 justify-center flex-wrap">
                  {(Object.keys(moodConfig) as Mood[]).map((mood) => (
                    <Button
                      key={mood}
                      variant={currentMood === mood ? "default" : "outline"}
                      className={`flex flex-col gap-2 h-auto py-4 px-6 ${currentMood === mood ? moodConfig[mood].color : ''}`}
                      onClick={() => setCurrentMood(mood)}
                    >
                      <Icon name={moodConfig[mood].icon as any} size={24} />
                      <span className="text-sm">{moodConfig[mood].label}</span>
                    </Button>
                  ))}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Что у тебя на душе? Напиши о своих чувствах..."
                    value={diaryText}
                    onChange={(e) => setDiaryText(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <Button 
                    className="w-full sm:w-auto" 
                    onClick={saveDiaryEntry}
                    disabled={isSaving || !diaryText.trim()}
                  >
                    <Icon name="Save" size={16} className="mr-2" />
                    {isSaving ? 'Сохраняем...' : 'Сохранить запись'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Мои записи</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {diaryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{entry.date}</span>
                      <Badge className={moodConfig[entry.mood].color}>
                        <Icon name={moodConfig[entry.mood].icon as any} size={14} className="mr-1" />
                        {moodConfig[entry.mood].label}
                      </Badge>
                    </div>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="animate-fade-in">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="font-heading">Сообщество поддержки</CardTitle>
                <CardDescription>Общайтесь, делитесь опытом и поддерживайте друг друга</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 animate-slide-up">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">{msg.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.user}</span>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 mt-4">
                  <Input placeholder="Напишите сообщение..." />
                  <Button size="icon">
                    <Icon name="Send" size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Icon name="Wind" size={20} className="text-primary" />
                    Дыхательное упражнение
                  </CardTitle>
                  <CardDescription>Техника 4-4-4 для снятия стресса</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`w-32 h-32 mx-auto rounded-full border-4 border-primary flex items-center justify-center ${isBreathing ? 'animate-pulse' : ''}`}>
                      <span className="text-3xl font-heading">{breathCount}</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {!isBreathing ? 'Нажми кнопку и следуй инструкциям' : 'Вдох 4 сек → Задержка 4 сек → Выдох 4 сек'}
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleBreathExercise}
                    disabled={isBreathing}
                  >
                    {isBreathing ? 'Дышим...' : 'Начать упражнение'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Icon name="Sparkles" size={20} className="text-primary" />
                    Аффирмации
                  </CardTitle>
                  <CardDescription>Позитивные установки для уверенности</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {affirmations.map((affirmation, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                    >
                      <p className="text-sm font-medium">{affirmation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Icon name="Moon" size={20} className="text-primary" />
                    Медитация
                  </CardTitle>
                  <CardDescription>Практики осознанности</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Icon name="Play" size={16} className="mr-2" />
                    Утренняя медитация (10 мин)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Icon name="Play" size={16} className="mr-2" />
                    Снятие тревоги (5 мин)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Icon name="Play" size={16} className="mr-2" />
                    Перед сном (15 мин)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Icon name="Calendar" size={20} className="text-primary" />
                    Консультация психолога
                  </CardTitle>
                  <CardDescription>Записаться на встречу со специалистом</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Наши профессиональные психологи готовы помочь вам в любое удобное время
                  </p>
                  <Button className="w-full">
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Записаться на консультацию
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Твой прогресс</CardTitle>
                <CardDescription>Отслеживай свое эмоциональное состояние</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Уровень стресса</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <Progress value={35} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Уверенность в себе</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Общее настроение</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-3" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-2xl font-heading font-bold text-success-foreground">14</div>
                    <div className="text-xs text-muted-foreground mt-1">Дней практики</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-heading font-bold text-primary">8</div>
                    <div className="text-xs text-muted-foreground mt-1">Записей в дневнике</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="text-2xl font-heading font-bold text-accent-foreground">12</div>
                    <div className="text-xs text-muted-foreground mt-1">Медитаций</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="text-2xl font-heading font-bold text-secondary-foreground">5</div>
                    <div className="text-xs text-muted-foreground mt-1">Дней подряд</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Динамика настроения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-2">
                  {[65, 45, 70, 55, 80, 68, 72].map((height, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Истории других женщин</CardTitle>
                <CardDescription>Вдохновляющие истории преодоления трудностей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Анастасия', topic: 'Как я справилась с паническими атаками', likes: 124 },
                  { name: 'Ольга', topic: 'Мой путь к принятию себя', likes: 98 },
                  { name: 'Екатерина', topic: 'Преодоление послеродовой депрессии', likes: 156 }
                ].map((story, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-heading font-semibold mb-1">{story.topic}</h4>
                        <p className="text-sm text-muted-foreground">Автор: {story.name}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Icon name="Heart" size={16} className="mr-1" />
                        {story.likes}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Статьи и ресурсы</CardTitle>
                <CardDescription>Полезная информация о психическом здоровье</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="FileText" size={16} className="mr-2" />
                  Как распознать симптомы тревожности
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="FileText" size={16} className="mr-2" />
                  Техники управления стрессом в повседневной жизни
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="FileText" size={16} className="mr-2" />
                  Когда стоит обратиться к психологу
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}