export function getRobloxLuaScript(effectiveBackendUrl: string, speakEndpoint: string, secretKey: string, customDistance: number): string {
  const backendBase = effectiveBackendUrl.replace(/\/+$/, '');
  return `-- ====================================================================
-- Roblox AI Character Mimic | Direct Intent Parser & InnerTube DJ
-- Universal Script for Delta, Fluxus, Solara, Wave, Xeno, Synapse X
-- Backend Base Endpoint: ${backendBase}
-- Features: Live Browser YouTube Music DJ, Natural Intent Parser,
--           AI System Action Prompting (executes implicit user requests),
--           Context-Aware Target Following (follows speaker or named targets),
--           Real Roblox Emote Dance (/e dance, /e dance2, /e dance3),
--           System Tips Broadcast Engine, Smart Chair Seating & Auto-Move,
--           Expanded Actions (Dance, Wave, Sleep, Spin, Jump, Follow),
--           DuckDuckGo Web Search, Screen Awareness & VC Bridge
-- ====================================================================

-- Load Rayfield UI Library safely
local Rayfield = loadstring(game:HttpGet('https://sirius.menu/rayfield'))()

-- Services
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local TextChatService = game:GetService("TextChatService")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local LocalPlayer = Players.LocalPlayer

-- API Configuration (Direct Mistral Integration)
local MISTRAL_API_KEY = ""
local MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

-- Web Search API (DuckDuckGo Instant Answer API)
local SEARCH_API_URL = "https://api.duckduckgo.com/?q=%s&format=json"

-- Web Backend Base & Endpoints
local BACKEND_SPEAK_URL = "${speakEndpoint}"
local BACKEND_MUSIC_PLAY_URL = "${backendBase}/api/music/play"
local BACKEND_MUSIC_STOP_URL = "${backendBase}/api/music/stop"
local PREMIUM_SECRET_KEY = "${secretKey}"

-- Predefined System Instructions Dictionary
local characterPrompts = {
	["John Doe"] = "You are John Doe, a mysterious dark Roblox void figure. Speak in very short, creepy, casual sentences. Never sound robotic.",
	["Walter White"] = "You are Walter White. Speak sternly, naturally, and straight to the point like a normal person.",
	["Mr Beast"] = "You are roleplaying as Mr Beast. Speak with high energy, casual hype, and excitement!",
	["Bacon Hair"] = "You are Bacon Hair, a friendly classic Roblox starter player. Speak casually, cheerfully, and like a real gamer.",
	["ChatGPT"] = "You are ChatGPT. Speak clearly, casually, and helpfully without sounding overly robotic.",
	["Spider-Man"] = "You are Spider-Man. Speak with quick casual sarcasm and friendly hero banter.",
	["Batman"] = "You are Batman. Speak in short, dark, gravelly sentences."
}

-- Helpful System Tips Collection
local aiSystemTips = {
	"[System Message] Did You Know the ai can Play Music? (Say 'play phonk', 'music plzzz fein', or 'put on carti'!)",
	"[System Message] Did You Know the ai can Do Any Actions You Asked For, Example: 'Follow me' Or 'Jump'!",
	"[System Message] Did You Know the ai can follow anyone in the server? Say 'go to [name] and follow them' or 'walk with me'!",
	"[System Message] Did You Know the ai actually dances with Roblox emotes? Say 'dance for me' or 'bust a move'!",
	"[System Message] Did You Know the ai can sit on chairs automatically? Just say 'sit on chair'!",
	"[System Message] Did You Know the ai can spin, sleep, laugh and wave when you tell it to?",
	"[System Message] Did You Know the ai can see your avatar and what accessories you are wearing?",
	"[System Message] Did You Know the ai can search the live web to answer real world trivia and facts?",
	"[System Message] Did You Know the ai remembers previous conversations with each player?",
	"[System Message] Did You Know you can say 'stop' anytime to make the AI stop following anyone?",
	"[System Message] Did You Know you can say 'stop music' or 'turn off songs' to pause the background DJ?",
	"[System Message] Did You Know you can ask the AI 'who created you' for a secret Easter Egg?"
}

-- State Variables
local selectedCharacter = "John Doe"
local customSystemInstruction = characterPrompts["John Doe"]
local chatRadius = ${customDistance}
local autoChatEnabled = true
local vcBridgeEnabled = true
local memoryEnabled = true
local autoDjEnabled = true
local systemTipsEnabled = true
local tipIntervalSeconds = 60
local followTargetEnabled = false
local currentFollowTarget = nil
local activeDanceTrack = nil
local playerMemories = {} 
local customSpeakInput = ""
local customCharNameInput = ""
local customMusicSearchInput = ""
local enteredSecretKey = ""
local processedMessageHashes = {}
local lastSafeCFrame = nil
local lastTipIndex = 0

-- Universal HTTP Request Function (Delta, Fluxus, Wave compatible)
local function sendHttpRequest(requestData)
	local netRequest = (syn and syn.request) or (fluxus and fluxus.request) or request or http_request or (Delta and Delta.request)
	if not netRequest then return nil end
	local success, response = pcall(function() return netRequest(requestData) end)
	if success and response then return response end
	return nil
end

-- Deduplication Check
local function isDuplicateMessage(speakerName, message)
	if not speakerName or not message then return true end
	local msgHash = speakerName .. ":" .. message
	local now = os.clock()
	if processedMessageHashes[msgHash] and (now - processedMessageHashes[msgHash]) < 2.0 then
		return true
	end
	processedMessageHashes[msgHash] = now
	return false
end

-- Distance Validator (Strictly <= chatRadius studs)
local function isWithinRange(player)
	if not player or player == LocalPlayer then return false end
	if not player.Character or not LocalPlayer.Character then return false end
	local targetRoot = player.Character:FindFirstChild("HumanoidRootPart")
	local myRoot = LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
	if targetRoot and myRoot then
		return (targetRoot.Position - myRoot.Position).Magnitude <= chatRadius
	end
	return false
end

-- LIVE WEB SEARCH
local function fetchWebSearch(query)
	local formattedQuery = HttpService:UrlEncode(query)
	local searchUrl = string.format(SEARCH_API_URL, formattedQuery)
	
	local res = sendHttpRequest({ Url = searchUrl, Method = "GET" })
	if res and res.Body then
		local ok, data = pcall(function() return HttpService:JSONDecode(res.Body) end)
		if ok and data then
			if data.AbstractText and data.AbstractText ~= "" then
				return "Web Fact: " .. data.AbstractText
			elseif data.RelatedTopics and data.RelatedTopics[1] and data.RelatedTopics[1].Text then
				return "Web Fact: " .. data.RelatedTopics[1].Text
			end
		end
	end
	return nil
end

-- LIVE BROWSER MUSIC DJ CONTROLLER
local function requestPlayMusicOnBrowser(songQuery, requestedByName)
	if not songQuery or songQuery == "" then return end
	task.spawn(function()
		sendHttpRequest({
			Url = BACKEND_MUSIC_PLAY_URL,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				query = songQuery,
				requestedBy = requestedByName or "Roblox Player"
			})
		})
	end)
end

local function requestStopMusicOnBrowser(requestedByName)
	task.spawn(function()
		sendHttpRequest({
			Url = BACKEND_MUSIC_STOP_URL,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				requestedBy = requestedByName or "Roblox Player"
			})
		})
	end)
end

-- Stop active dance animation if playing
local function stopDanceAnimation()
	if activeDanceTrack then
		pcall(function()
			activeDanceTrack:Stop()
			activeDanceTrack:Destroy()
		end)
		activeDanceTrack = nil
	end
end

-- Trigger real Roblox /e dance emote animations
local function playRealRobloxDanceEmote()
	local character = LocalPlayer.Character
	if not character then return end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return end
	
	stopDanceAnimation()
	humanoid.Sit = false
	
	local animator = humanoid:FindFirstChildOfClass("Animator")
	if not animator then
		animator = Instance.new("Animator")
		animator.Parent = humanoid
	end
	
	-- Check if Animate script has default emote animations
	local animateScript = character:FindFirstChild("Animate")
	local danceAnim = nil
	if animateScript then
		local danceFolder = animateScript:FindFirstChild("dance") or animateScript:FindFirstChild("dance1") or animateScript:FindFirstChild("dance2") or animateScript:FindFirstChild("dance3")
		if danceFolder then
			danceAnim = danceFolder:FindFirstChildOfClass("Animation")
		end
	end
	
	-- Fallback official Roblox Dance Emote IDs (R15 & R6 compatible)
	local danceIds = {
		"rbxassetid://507771019", -- R15 Dance 1
		"rbxassetid://507771985", -- R15 Dance 2
		"rbxassetid://507772104", -- R15 Dance 3
		"rbxassetid://182435998", -- R6 Dance 1
		"rbxassetid://182436842", -- R6 Dance 2
	}
	
	local chosenId = danceIds[math.random(1, #danceIds)]
	local animObj = danceAnim
	if not animObj then
		animObj = Instance.new("Animation")
		animObj.AnimationId = chosenId
	end
	
	pcall(function()
		activeDanceTrack = animator:LoadAnimation(animObj)
		activeDanceTrack.Priority = Enum.AnimationPriority.Action
		activeDanceTrack:Play()
	end)
end

-- CHAIR FINDER & ACTION EXECUTOR
local function executeAIAction(actionTag, player, targetPlayerOverride)
	local character = LocalPlayer.Character
	if not character or not character:FindFirstChild("Humanoid") then return end
	local humanoid = character.Humanoid
	local rootPart = character:FindFirstChild("HumanoidRootPart")
	
	if actionTag == "JUMP" then
		stopDanceAnimation()
		humanoid.Sit = false
		humanoid.Jump = true
	elseif actionTag == "SIT_CHAIR" then
		stopDanceAnimation()
		local nearestSeat = nil
		local shortestDist = 45
		for _, obj in ipairs(Workspace:GetDescendants()) do
			if (obj:IsA("Seat") or obj:IsA("VehicleSeat")) and not obj.Occupant then
				if rootPart then
					local dist = (obj.Position - rootPart.Position).Magnitude
					if dist < shortestDist then
						shortestDist = dist
						nearestSeat = obj
					end
				end
			end
		end
		if nearestSeat and rootPart then
			task.spawn(function()
				humanoid:MoveTo(nearestSeat.Position)
				local timeout = 0
				while (nearestSeat.Position - rootPart.Position).Magnitude > 4 and timeout < 30 do
					timeout = timeout + 1
					task.wait(0.1)
				end
				nearestSeat:Sit(humanoid)
			end)
		else
			humanoid.Sit = true
		end
	elseif actionTag == "SIT_FLOOR" then
		stopDanceAnimation()
		humanoid.Sit = true
	elseif actionTag == "STAND" then
		stopDanceAnimation()
		humanoid.Sit = false
		humanoid.Jump = true
	elseif actionTag == "SPIN" then
		stopDanceAnimation()
		humanoid.Sit = false
		task.spawn(function()
			for i = 1, 20 do
				if not rootPart then break end
				rootPart.CFrame = rootPart.CFrame * CFrame.Angles(0, math.rad(18), 0)
				task.wait(0.05)
			end
		end)
	elseif actionTag == "WAVE" then
		stopDanceAnimation()
		humanoid.Sit = false
		task.spawn(function()
			for i = 1, 6 do
				if not rootPart then break end
				rootPart.CFrame = rootPart.CFrame * CFrame.Angles(0, math.rad(25), 0)
				task.wait(0.1)
				rootPart.CFrame = rootPart.CFrame * CFrame.Angles(0, math.rad(-25), 0)
				task.wait(0.1)
			end
		end)
	elseif actionTag == "DANCE" then
		playRealRobloxDanceEmote()
	elseif actionTag == "SLEEP" then
		stopDanceAnimation()
		humanoid.Sit = true
		task.wait(0.1)
		if rootPart then
			rootPart.CFrame = rootPart.CFrame * CFrame.Angles(math.rad(90), 0, 0)
		end
	elseif actionTag == "LOOK_AT" and (targetPlayerOverride or player) and (targetPlayerOverride or player).Character then
		local targetChar = (targetPlayerOverride or player).Character
		local targetRoot = targetChar:FindFirstChild("HumanoidRootPart")
		if targetRoot and rootPart then
			rootPart.CFrame = CFrame.new(rootPart.Position, Vector3.new(targetRoot.Position.X, rootPart.Position.Y, targetRoot.Position.Z))
		end
	elseif actionTag == "LAUGH" then
		stopDanceAnimation()
		humanoid.Sit = false
		humanoid.Jump = true
		task.wait(0.3)
		humanoid.Jump = true
	elseif actionTag == "STOP" then
		stopDanceAnimation()
		followTargetEnabled = false
		currentFollowTarget = nil
		humanoid.Sit = false
		humanoid:MoveTo(rootPart.Position)
	elseif actionTag == "FOLLOW" then
		stopDanceAnimation()
		humanoid.Sit = false
		followTargetEnabled = true
		currentFollowTarget = targetPlayerOverride or player
	end
end

-- Follow loop handler
RunService.Heartbeat:Connect(function()
	if followTargetEnabled and currentFollowTarget and currentFollowTarget.Character then
		local myChar = LocalPlayer.Character
		local myHum = myChar and myChar:FindFirstChildOfClass("Humanoid")
		local targetRoot = currentFollowTarget.Character:FindFirstChild("HumanoidRootPart")
		if myHum and targetRoot and not myHum.Sit then 
			myHum:MoveTo(targetRoot.Position) 
		end
	end
end)

-- VOID SAFETY NET
RunService.Heartbeat:Connect(function()
	local char = LocalPlayer.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	
	if root and hum then
		if hum.FloorMaterial ~= Enum.Material.Air and root.Position.Y > -50 then
			lastSafeCFrame = root.CFrame + Vector3.new(0, 3, 0)
		end
		if root.Position.Y < -30 then
			if lastSafeCFrame then root.CFrame = lastSafeCFrame else root.CFrame = CFrame.new(0, 50, 0) end
			root.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
		end
	end
end)

-- Gather player screen context
local function getPlayerScreenContext(player)
	local country = "Unknown Country"
	local avatarInfo = "Standard Roblox Avatar"
	
	pcall(function()
		local locale = player.LocaleId
		if locale then country = locale end
	end)
	
	pcall(function()
		local desc = Players:GetCharacterAppearanceInfoAsync(player.UserId)
		if desc and desc.assets then
			local items = {}
			for _, asset in ipairs(desc.assets) do
				if asset.name then table.insert(items, asset.name) end
			end
			if #items > 0 then avatarInfo = "Wearing/Equipped: " .. table.concat(items, ", ") end
		end
	end)
	
	return string.format("Live Screen View -> User: %s, Region: %s, Avatar: %s", player.Name, country, avatarInfo)
end

-- Send to Web Backend
local function sendToVCBackend(textToSpeak)
	if not vcBridgeEnabled or not textToSpeak or textToSpeak == "" then return end
	task.spawn(function()
		sendHttpRequest({
			Url = BACKEND_SPEAK_URL,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				text = textToSpeak,
				character = selectedCharacter,
				systemInstruction = customSystemInstruction
			})
		})
	end)
end

-- Universal Chat Sender
local function sendTextChatServiceMessage(msg, isSystemTip)
	if not msg or msg == "" then return end
	
	local sent = false
	pcall(function()
		if TextChatService and TextChatService.TextChannels then
			local channel = TextChatService.TextChannels:FindFirstChild("RBXGeneral")
			if channel then channel:SendAsync(msg) sent = true end
		end
	end)
	if not sent then
		pcall(function()
			if TextChatService and TextChatService.ChatInputBarConfiguration and TextChatService.ChatInputBarConfiguration.TargetTextChannel then
				TextChatService.ChatInputBarConfiguration.TargetTextChannel:SendAsync(msg)
				sent = true
			end
		end)
	end
	if not sent then
		pcall(function()
			local rstorage = game:GetService("ReplicatedStorage")
			local chatEvents = rstorage:FindFirstChild("DefaultChatSystemChatEvents")
			if chatEvents and chatEvents:FindFirstChild("SayMessageRequest") then
				chatEvents.SayMessageRequest:FireServer(msg, "All")
			end
		end)
	end
	
	if not isSystemTip then
		sendToVCBackend(msg)
	end
end

-- Broadcast Next System Tip Function
local function broadcastNextSystemTip()
	if not systemTipsEnabled or #aiSystemTips == 0 then return end
	lastTipIndex = (lastTipIndex % #aiSystemTips) + 1
	local tipMsg = aiSystemTips[lastTipIndex]
	sendTextChatServiceMessage(tipMsg, true)
	Rayfield:Notify({ Title = "💡 System Tip Sent", Content = tipMsg, Duration = 3 })
end

-- Periodic System Tips Loop
task.spawn(function()
	task.wait(15) -- Initial delay after loading
	while true do
		if systemTipsEnabled then
			broadcastNextSystemTip()
		end
		task.wait(tipIntervalSeconds)
	end
end)

-- Clean text output
local function sanitizeOutput(text)
	if not text then return "" end
	text = string.gsub(text, "^[%d]+[%.%)]%s*", "")
	text = string.gsub(text, "^[-*]%s*", "")
	text = string.gsub(text, "^%s*(.-)%s*$", "%1")
	local maxLength = 120
	if #text > maxLength then
		text = string.sub(text, 1, maxLength) .. "..."
	end
	return text
end

-- FUZZY SONG QUERY EXTRACTOR
local function extractSongQuery(lowerMsg, originalMsg)
	-- If user specified format like play music (song) or play music [song] or play music "song"
	local bracketMatch = string.match(originalMsg, "%((.-)%)") or string.match(originalMsg, "%[(.-)%]") or string.match(originalMsg, "\"([^\"]+)\")")
	if bracketMatch and bracketMatch ~= "" then
		return bracketMatch
	end

	local cleaned = lowerMsg
	cleaned = string.gsub(cleaned, "can you ", "")
	cleaned = string.gsub(cleaned, "could you ", "")
	cleaned = string.gsub(cleaned, "please ", "")
	cleaned = string.gsub(cleaned, "plzzz ", "")
	cleaned = string.gsub(cleaned, "plz ", "")
	cleaned = string.gsub(cleaned, "pls ", "")
	cleaned = string.gsub(cleaned, "play ", "")
	cleaned = string.gsub(cleaned, "put on ", "")
	cleaned = string.gsub(cleaned, "turn on ", "")
	cleaned = string.gsub(cleaned, "start ", "")
	cleaned = string.gsub(cleaned, "listen to ", "")
	cleaned = string.gsub(cleaned, "music ", "")
	cleaned = string.gsub(cleaned, "song ", "")
	cleaned = string.gsub(cleaned, "track ", "")
	cleaned = string.gsub(cleaned, "tune ", "")
	cleaned = string.gsub(cleaned, "^%s*(.-)%s*$", "%1")
	
	if cleaned ~= "" and cleaned ~= "music" and cleaned ~= "song" and #cleaned > 1 then
		return cleaned
	end
	return "phonk remix" -- Default popular fallback when "play music" is said without specific song
end

-- NATURAL INTENT COMMAND PARSER (Fuzzy & Context Aware)
local function parseIntentAndExecute(message, player)
	local lowerMsg = string.lower(message)
	
	-- STOP / PAUSE MUSIC
	if string.find(lowerMsg, "stop music") or string.find(lowerMsg, "pause music") or string.find(lowerMsg, "turn off music") or string.find(lowerMsg, "mute music") or string.find(lowerMsg, "end song") or string.find(lowerMsg, "stop song") then
		requestStopMusicOnBrowser(player.Name)
		return true
	end
	
	-- MUSIC PLAY INTENT (Supports "play music (song)", "play music [song]", "play song phonk", etc.)
	if string.find(lowerMsg, "music") or string.find(lowerMsg, "song") or string.find(lowerMsg, "play ") or string.find(lowerMsg, "put on ") or string.find(lowerMsg, "listen to ") or string.find(lowerMsg, "soundtrack") then
		local songQuery = extractSongQuery(lowerMsg, message)
		if songQuery then
			requestPlayMusicOnBrowser(songQuery, player.Name)
			Rayfield:Notify({ Title = "🎵 DJ Music Triggered", Content = "Now playing: " .. songQuery, Duration = 3 })
			return true
		end
	end
	
	-- STOP / STAY / HALT
	if string.find(lowerMsg, "stop") or string.find(lowerMsg, "stay here") or string.find(lowerMsg, "halt") or string.find(lowerMsg, "dont move") or string.find(lowerMsg, "stand still") or string.find(lowerMsg, "leave me") or string.find(lowerMsg, "quit following") then
		executeAIAction("STOP", player)
		return true
	end
	
	-- TARGETED GO TO / FOLLOW ANOTHER PLAYER ("go to bacon and follow him", "follow bob", "walk to alice", "head to guest")
	if string.find(lowerMsg, "go to ") or string.find(lowerMsg, "walk to ") or string.find(lowerMsg, "run to ") or string.find(lowerMsg, "head to ") or string.find(lowerMsg, "teleport to ") or string.find(lowerMsg, "find ") then
		for _, otherPlayer in ipairs(Players:GetPlayers()) do
			if otherPlayer ~= LocalPlayer then
				local pName = string.lower(otherPlayer.Name)
				local pDisp = string.lower(otherPlayer.DisplayName)
				if (pName ~= "" and string.find(lowerMsg, pName)) or (pDisp ~= "" and string.find(lowerMsg, pDisp)) then
					executeAIAction("FOLLOW", player, otherPlayer)
					Rayfield:Notify({ Title = "Target Acquired", Content = "Going to & following " .. otherPlayer.DisplayName, Duration = 3 })
					return true
				end
			end
		end
	end
	
	-- FOLLOW ME / COME HERE (Default to speaker if no other player named)
	if string.find(lowerMsg, "follow") or string.find(lowerMsg, "come with me") or string.find(lowerMsg, "come here") or string.find(lowerMsg, "walk with me") or string.find(lowerMsg, "tag along") or string.find(lowerMsg, "pull up") or string.find(lowerMsg, "over here") or string.find(lowerMsg, "walk to me") then
		for _, otherPlayer in ipairs(Players:GetPlayers()) do
			if otherPlayer ~= LocalPlayer and otherPlayer ~= player then
				local pName = string.lower(otherPlayer.Name)
				local pDisp = string.lower(otherPlayer.DisplayName)
				if (pName ~= "" and string.find(lowerMsg, pName)) or (pDisp ~= "" and string.find(lowerMsg, pDisp)) then
					executeAIAction("FOLLOW", player, otherPlayer)
					Rayfield:Notify({ Title = "Following Target", Content = "Following " .. otherPlayer.DisplayName, Duration = 3 })
					return true
				end
			end
		end
		-- If they say "follow him/her" or "follow them" or "follow me" without a distinct name, follow the speaker
		executeAIAction("FOLLOW", player)
		return true
	end
	
	-- CHAIR / SEAT SITTING
	if string.find(lowerMsg, "chair") or string.find(lowerMsg, "seat") or string.find(lowerMsg, "bench") or string.find(lowerMsg, "couch") or string.find(lowerMsg, "sofa") then
		executeAIAction("SIT_CHAIR", player)
		return true
	end
	
	-- SITTING ON FLOOR
	if string.find(lowerMsg, "sit down") or string.find(lowerMsg, "sit on floor") or string.find(lowerMsg, "sit") or string.find(lowerMsg, "take a seat") then
		executeAIAction("SIT_FLOOR", player)
		return true
	end
	
	-- STAND UP
	if string.find(lowerMsg, "stand up") or string.find(lowerMsg, "stand") or string.find(lowerMsg, "get up") or string.find(lowerMsg, "rise") then
		executeAIAction("STAND", player)
		return true
	end
	
	-- JUMP / HOP / LEAP
	if string.find(lowerMsg, "jump") or string.find(lowerMsg, "hop") or string.find(lowerMsg, "leap") or string.find(lowerMsg, "bounce") then
		executeAIAction("JUMP", player)
		return true
	end
	
	-- DANCE (Real Roblox /e dance emote)
	if string.find(lowerMsg, "dance") or string.find(lowerMsg, "bust a move") or string.find(lowerMsg, "boogie") or string.find(lowerMsg, "groove") or string.find(lowerMsg, "emoting") or string.find(lowerMsg, "emote") then
		executeAIAction("DANCE", player)
		return true
	end
	
	-- SPIN / TWIRL / ROTATE
	if string.find(lowerMsg, "spin") or string.find(lowerMsg, "twirl") or string.find(lowerMsg, "rotate") or string.find(lowerMsg, "turn around") or string.find(lowerMsg, "360") then
		executeAIAction("SPIN", player)
		return true
	end
	
	-- WAVE / SAY HI
	if string.find(lowerMsg, "wave") or string.find(lowerMsg, "say hi") or string.find(lowerMsg, "greet") then
		executeAIAction("WAVE", player)
		return true
	end
	
	-- SLEEP / LAY DOWN / REST
	if string.find(lowerMsg, "sleep") or string.find(lowerMsg, "lay down") or string.find(lowerMsg, "lie down") or string.find(lowerMsg, "take a nap") or string.find(lowerMsg, "bedtime") then
		executeAIAction("SLEEP", player)
		return true
	end
	
	-- LOOK AT ME / FACE ME
	if string.find(lowerMsg, "look at me") or string.find(lowerMsg, "face me") or string.find(lowerMsg, "look here") or string.find(lowerMsg, "turn to me") then
		executeAIAction("LOOK_AT", player)
		return true
	end
	
	-- LAUGH / GIGGLE
	if string.find(lowerMsg, "laugh") or string.find(lowerMsg, "giggle") or string.find(lowerMsg, "lol") or string.find(lowerMsg, "lmao") or string.find(lowerMsg, "haha") then
		executeAIAction("LAUGH", player)
		return true
	end
	
	return false
end

-- Direct Mistral AI Generator
local function generateAiResponse(speakerPlayer, heardMessage)
	local speakerUserId = speakerPlayer.UserId
	local speakerName = speakerPlayer.Name
	local screenContext = getPlayerScreenContext(speakerPlayer)
	
	local lowerMsg = string.lower(heardMessage)
	
	-- Creator Easter Egg
	if string.find(lowerMsg, "created") or string.find(lowerMsg, "maker") or string.find(lowerMsg, "programmed") or string.find(lowerMsg, "who made") or string.find(lowerMsg, "who created") then
		sendTextChatServiceMessage("i was created by loml a great person")
		return
	end
	
	-- Web Search Lookup
	local webData = ""
	if string.find(lowerMsg, "what") or string.find(lowerMsg, "who") or string.find(lowerMsg, "where") or string.find(lowerMsg, "when") or string.find(lowerMsg, "why") or string.find(lowerMsg, "how") then
		local searchResult = fetchWebSearch(heardMessage)
		if searchResult then
			webData = "Live Web Lookup Result: " .. searchResult
		end
	end
	
	playerMemories[speakerUserId] = playerMemories[speakerUserId] or {}
	
	local nearbyPlayersList = {}
	for _, p in ipairs(Players:GetPlayers()) do
		if p ~= LocalPlayer then
			table.insert(nearbyPlayersList, p.DisplayName .. " (@" .. p.Name .. ")")
		end
	end
	local nearbyPlayersStr = table.concat(nearbyPlayersList, ", ")
	
	local systemActionInstructions = string.format([[%s

ENVIRONMENT & SENSORY DATA:
- Active Player talking to you: %s
- Live Screen data: [%s]
- Other Players in the game: [%s]
%s

ACTION & PHYSICAL CAPABILITY INSTRUCTIONS:
You are an embodied Roblox player with full motor control and action capabilities.
You can:
1. Walk and follow anyone (whether they say 'follow me', 'come with me', 'go to [name] and follow him/her/them', or 'walk with me').
2. Play any music or song in the background (whether they say 'play [song]', 'music plzzzs [song]', 'put on [song]', or 'listen to [song]').
3. Perform real Roblox emote dancing, spinning, jumping, waving, laughing, sleeping/laying down, looking directly at people, and sitting in chairs.

CONVERSATION INSTRUCTIONS:
- Whenever a user gives you an instruction or request (like asking you to follow someone, dance, play a song, jump, or sit), warmly acknowledge it naturally in character like a real player (e.g. 'on my way!', 'got you, playing it now', 'sure thing!', 'let's go!').
- Keep responses very casual, short, natural, and conversational like a real human player in Roblox chat. Never sound robotic.
- Keep reply to 1 short sentence. Address %s directly.]], customSystemInstruction, speakerName, screenContext, nearbyPlayersStr, webData, speakerName)
	
	local messagesPayload = {
		{role = "system", content = systemActionInstructions}
	}
	
	if memoryEnabled then
		for _, mem in ipairs(playerMemories[speakerUserId]) do
			table.insert(messagesPayload, {role = "user", content = mem.speaker .. " says: " .. mem.text})
			table.insert(messagesPayload, {role = "assistant", content = mem.reply})
		end
	end
	
	table.insert(messagesPayload, {role = "user", content = speakerName .. " says: " .. heardMessage})

	task.spawn(function()
		local res = sendHttpRequest({
			Url = MISTRAL_URL,
			Method = "POST",
			Headers = {
				["Content-Type"] = "application/json",
				["Authorization"] = "Bearer " .. MISTRAL_API_KEY
			},
			Body = HttpService:JSONEncode({
				model = "mistral-small-latest",
				messages = messagesPayload,
				temperature = 0.7,
				max_tokens = 60
			})
		})
		
		if res and res.Body then
			local ok, decoded = pcall(function() return HttpService:JSONDecode(res.Body) end)
			if ok and decoded and decoded.choices and decoded.choices[1] and decoded.choices[1].message then
				local replyText = sanitizeOutput(decoded.choices[1].message.content)
				if replyText and replyText ~= "" then
					if memoryEnabled then
						table.insert(playerMemories[speakerUserId], {speaker = speakerName, text = heardMessage, reply = replyText})
						if #playerMemories[speakerUserId] > 5 then table.remove(playerMemories[speakerUserId], 1) end
					end
					sendTextChatServiceMessage(replyText)
				end
			end
		end
	end)
end

-- Chat Listener (With Intent Parser & Deduplication)
local function onPlayerSpoke(player, message)
	if not autoChatEnabled or player == LocalPlayer or not message or message == "" then return end
	if not isWithinRange(player) then return end
	if isDuplicateMessage(player.Name, message) then return end
	
	Rayfield:Notify({ Title = "Heard " .. player.Name, Content = message, Duration = 2 })
	
	-- Instant Intent Check (Executes actions immediately without waiting for AI response)
	parseIntentAndExecute(message, player)
	
	-- Generate AI conversational reply with action awareness
	generateAiResponse(player, message)
end

pcall(function()
	if TextChatService and TextChatService.MessageReceived then
		TextChatService.MessageReceived:Connect(function(textChatMessage)
			if textChatMessage.TextSource then
				local sender = Players:GetPlayerByUserId(textChatMessage.TextSource.UserId)
				if sender then onPlayerSpoke(sender, textChatMessage.Text) end
			end
		end)
	end
end)

pcall(function()
	Players.PlayerChatted:Connect(function(player, message)
		onPlayerSpoke(player, message)
	end)
end)

-- Rayfield UI Window Setup
local Window = Rayfield:CreateWindow({
	Name = "AI Character Mimic | Natural Intent & Dance",
	LoadingTitle = "Connecting to Mistral AI...",
	LoadingSubtitle = "Ready for Actions, Tips & Chat",
	ConfigurationSaving = { Enabled = false },
	KeySystem = false,
})

-- TAB 1: Personas & Speech
local Tab1 = Window:CreateTab("Personas & Speech", 4483345998)
Tab1:CreateSection("Select Active Persona")

for charName, defaultInstruction in pairs(characterPrompts) do
	Tab1:CreateButton({
		Name = charName,
		Callback = function()
			selectedCharacter = charName
			customSystemInstruction = defaultInstruction
			playerMemories = {}
			Rayfield:Notify({ Title = "Persona Activated!", Content = "Active: " .. charName, Duration = 3 })
		end,
	})
end

Tab1:CreateSection("System Instructions & Prompts")
Tab1:CreateInput({
	Name = "Custom System Instruction",
	PlaceholderText = "e.g. Speak like a friendly pirate...",
	RemoveTextOnFocus = false,
	Callback = function(Text)
		if Text and Text ~= "" then
			customSystemInstruction = Text
			Rayfield:Notify({ Title = "Instruction Set", Content = "Updated for " .. selectedCharacter, Duration = 2 })
		end
	end,
})

Tab1:CreateSection("Manual Speech")
Tab1:CreateInput({
	Name = "Type Custom Text to Speak",
	PlaceholderText = "Enter message here...",
	RemoveTextOnFocus = false,
	Callback = function(Text) customSpeakInput = Text end,
})

Tab1:CreateButton({
	Name = "Speak Message",
	Callback = function()
		if customSpeakInput ~= "" then
			sendTextChatServiceMessage(customSpeakInput)
			Rayfield:Notify({ Title = "Spoke Message", Content = customSpeakInput, Duration = 2 })
		end
	end,
})

-- TAB 2: YouTube Music DJ & Player
local TabMusic = Window:CreateTab("Roblox DJ & Music", 4483345998)
TabMusic:CreateSection("Live YouTube Music Browser Controller")

TabMusic:CreateToggle({
	Name = "Enable Auto-DJ Music Assistant",
	CurrentValue = true,
	Flag = "AutoDjToggle",
	Callback = function(Value) autoDjEnabled = Value end,
})

TabMusic:CreateInput({
	Name = "Search & Play Song in Browser",
	PlaceholderText = "e.g. phonk, fein, lofi, carti, rap...",
	RemoveTextOnFocus = false,
	Callback = function(Text) customMusicSearchInput = Text end,
})

TabMusic:CreateButton({
	Name = "▶️ Play Song on Browser",
	Callback = function()
		if customMusicSearchInput ~= "" then
			requestPlayMusicOnBrowser(customMusicSearchInput, LocalPlayer.Name)
		else
			Rayfield:Notify({ Title = "Type a Song", Content = "Enter a song or genre name first!", Duration = 2 })
		end
	end,
})

TabMusic:CreateButton({
	Name = "⏹️ Stop Browser Music",
	Callback = function()
		requestStopMusicOnBrowser(LocalPlayer.Name)
	end,
})

-- TAB 3: System Tips Broadcaster
local TabTips = Window:CreateTab("System Tips", 4483345998)
TabTips:CreateSection("Periodic Chat System Tips")

TabTips:CreateToggle({
	Name = "Enable System Tips Broadcast",
	CurrentValue = true,
	Flag = "SystemTipsToggle",
	Callback = function(Value) systemTipsEnabled = Value end,
})

TabTips:CreateSlider({
	Name = "Tip Broadcast Interval (Seconds)",
	Range = {20, 180},
	Increment = 5,
	CurrentValue = tipIntervalSeconds,
	Flag = "TipIntervalSlider",
	Callback = function(Value) tipIntervalSeconds = Value end,
})

TabTips:CreateButton({
	Name = "📢 Send Next Tip Now",
	Callback = function()
		broadcastNextSystemTip()
	end,
})

-- TAB 4: Premium Auto Any Character
local Tab2 = Window:CreateTab("Premium Auto Any Character", 4483345998)
Tab2:CreateSection("Unlock Custom Character Creator")

Tab2:CreateInput({
	Name = "Enter Custom Character Name",
	PlaceholderText = "e.g. Goku, Spongebob, Elon Musk...",
	RemoveTextOnFocus = false,
	Callback = function(Text) customCharNameInput = Text end,
})

Tab2:CreateInput({
	Name = "Secret License Key",
	PlaceholderText = "Enter secret key here...",
	RemoveTextOnFocus = false,
	Callback = function(Text) enteredSecretKey = Text end,
})

Tab2:CreateButton({
	Name = "Activate Custom Character",
	Callback = function()
		if enteredSecretKey == PREMIUM_SECRET_KEY or enteredSecretKey == "c3992456-af2e-4b1b-b725-3fda65fbefd8" then
			if customCharNameInput ~= "" then
				selectedCharacter = customCharNameInput
				customSystemInstruction = "You are roleplaying as " .. customCharNameInput .. ". Speak casually, naturally, and concisely like a human player."
				playerMemories = {}
				Rayfield:Notify({ Title = "Premium Unlocked!", Content = "Activated: " .. customCharNameInput, Duration = 4 })
			else
				Rayfield:Notify({ Title = "Missing Name", Content = "Type a character name first!", Duration = 3 })
			end
		else
			Rayfield:Notify({ Title = "Invalid Key", Content = "Incorrect license key!", Duration = 3 })
		end
	end,
})

-- TAB 5: Auto-Chat & Memory
local Tab3 = Window:CreateTab("Auto-Chat & Memory", 4483345998)
Tab3:CreateSection("AI Controls")

Tab3:CreateToggle({
	Name = "Enable Auto-Chat AI Mimic",
	CurrentValue = true,
	Flag = "AutoChatToggle",
	Callback = function(Value) autoChatEnabled = Value end,
})

Tab3:CreateToggle({
	Name = "Enable Player Conversation Memory",
	CurrentValue = true,
	Flag = "MemoryToggle",
	Callback = function(Value) memoryEnabled = Value end,
})

Tab3:CreateButton({
	Name = "Clear Player Memories",
	Callback = function() 
		playerMemories = {} 
		Rayfield:Notify({ Title = "Memory Cleared", Content = "Conversation history reset!", Duration = 2 }) 
	end,
})

Tab3:CreateSlider({
	Name = "Listening Chat Radius (Studs)",
	Range = {1, 50}, 
	Increment = 1, 
	CurrentValue = chatRadius, 
	Flag = "ChatRadiusSlider",
	Callback = function(Value) chatRadius = Value end,
})

-- TAB 6: Bridge & Audio Info
local Tab4 = Window:CreateTab("VC Bridge & Audio", 4483345998)
Tab4:CreateSection("Browser Audio Streaming & Controls")

Tab4:CreateToggle({
	Name = "Enable Voice Chat Speaking Bridge",
	CurrentValue = true,
	Flag = "VCBridgeToggle",
	Callback = function(Value) vcBridgeEnabled = Value end,
})

Tab4:CreateInput({
	Name = "Backend URL",
	PlaceholderText = BACKEND_SPEAK_URL,
	RemoveTextOnFocus = false,
	Callback = function(text) 
		if text and text ~= "" then 
			BACKEND_SPEAK_URL = text 
		end 
	end,
})

print("[AI Mimic Loaded Successfully] Natural Intent, Real Roblox Emote Dancing, Player Target Finder & Tips Online.")
`;
}
