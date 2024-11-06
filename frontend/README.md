# What is this app for?

A customisable chat experience designed to aid a csutomer through the ideation, search, and investigation stages of their journey. Use cases include data capture for search, filtering, results feedback, model based training and search, and more.

It enables you to keep your search data capture process simple, reduce UI complexity, make the user experience more enjoyable and engaging, and allow for a much richer and more personalised search experience.

Data can be captured and use in search, to generate personalised content or messages in platform, or stored later to aid with user segmentation and model training.

It could also be coupled with richer data labelling of product images for ecommerce, or semantic search and lookup.

It could also allow for contextual weighting of search, filter, or model parameters in search. For example, if a customer places a priority on a particular factor, or says I want these results to be more x, or more y.

# How does it work?

The embedded chat widget is initialised with your custom instructions, business context, and the goal of the interaction with the customer. You are also able to specify specific data points you would like to capture if they are mentioned by the customer, allowing you to use these as you see fit.


#### Ideas

- What does this product seek to enable or change? We're trying to rethink and reinvent the way a person finds something they want when in an online experience. Right now we start with a few words, and extrapolate from there. E.g. "white socks". Why can't we start from a paragraph? Or a person? Who are you? What are you looking for? Who, what, when, where and why are you here? Give us all the context.

On the flip side we have products, they might be semantically labelled for their literal qualities, characteristics, or category. Why don't we label their qualitative or contextual qualities? We have this in some contexts with product descriptions that cover when something should be used, why it's great, and who might love it. We should be able to leverage that when we're trying to find something that matches what a person is looking for.

Finally, there's the actual searching and refinement experience. Right now we capture literal information like filters and text search updates which is not very rich, and behavioural information like events, actions, funnels, and other behavioural analysis, which is insightful but not sepcific, nor necessarily immediately actionable within a user's session. Imagine we were having a conversation with the user the entire time they were using the product, and imagine we were analysing, understanding, and refining their experience in real time. It's like having a shop assistant run a user through your site to find exactly what they want - or even if you don't have what they want. The experience is built around a copilot experience.

But what if the user doesn't know what they want? Or is just browsing? Or just wants to uinderstand what you have or what you offer? That in itself is hugely insightful - you can segment from the getgo those with intent to buy and those without - but you can also offer a guided experience, based on tree like questions and follow up steps.

This tool is a natural language experience with intent and entity extraction inbuilt. It is designed to control search & discover (first), filter and refine (second), and book and pay (third).


#### Notes to self

- Natural language UX toolkit / search experience / platform experience
1. Maybe I just start by building that API, with a mock site and try to build out the different use cases for the api, different 'types' of message, or different user intents.
2. Maybe its a fully functional node or next.js plugin which controls routing, search, and other platforms actions automatically?
3. For demo, maybe there's a list of like 100 product images, and based on the user request and other context it tries to suggest and sell one of them?
4. I reckon the roadmap is search > filter > pay
5. The novelty is in the user experience, could it all be delivered within the bot itself?