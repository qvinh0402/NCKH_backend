// Test caching performance
const chatbotAIContext = require('./src/chatbot/chatbot-ai-context');

async function testCaching() {
  console.log('⏱️  Testing Menu Context Caching\n');

  console.log('1️⃣  First call (will fetch from database)...');
  const start1 = Date.now();
  const context1 = await chatbotAIContext.buildMenuContext();
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms`);
  console.log(`   Context length: ${context1.length} chars\n`);

  console.log('2️⃣  Second call (should use cache)...');
  const start2 = Date.now();
  const context2 = await chatbotAIContext.buildMenuContext();
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms (${time2 < time1 ? '✅ FASTER' : '❌ SLOWER'})`);
  console.log(`   Same content: ${context1 === context2 ? '✅ YES' : '❌ NO'}\n`);

  console.log('3️⃣  Test individual methods...');
  
  const startPizzas = Date.now();
  const pizzas = await chatbotAIContext.getAllPizzas(5);
  console.log(`   getAllPizzas: ${Date.now() - startPizzas}ms`);
  console.log(`   Found ${pizzas.length} pizzas:`);
  pizzas.forEach((p, i) => {
    console.log(`      ${i+1}. ${p.name} (${p.category}) - ${p.price.toLocaleString('vi-VN')}đ`);
  });

  console.log('\n4️⃣  Test cheapest pizzas...');
  const cheapest = await chatbotAIContext.getCheapestPizzas(3);
  console.log(`   Cheapest: ${cheapest[0]?.name} - ${cheapest[0]?.price.toLocaleString('vi-VN')}đ`);

  console.log('\n5️⃣  Test expensive pizzas...');
  const expensive = await chatbotAIContext.getExpensivePizzas(3);
  console.log(`   Most expensive: ${expensive[0]?.name} - ${expensive[0]?.price.toLocaleString('vi-VN')}đ`);

  console.log('\n6️⃣  Test categories...');
  const categories = await chatbotAIContext.getCategories();
  console.log(`   Categories: ${categories.map(c => c.name).join(', ')}`);

  console.log('\n✅ Caching test completed!');
  process.exit(0);
}

testCaching().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
