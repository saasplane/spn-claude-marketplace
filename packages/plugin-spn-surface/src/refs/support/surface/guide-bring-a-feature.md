<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/05-guides/02-bring-a-feature.md",
      "seen": "2a2deef9"
    }
  ]
}
-->

# Bring a Feature to the Agent — in Words, with Your Design, or with a Page to Follow

Source of truth: the foundation's guide of the same name (`docs/05-guides/02-bring-a-feature.md`). This ref restates it for a partner who holds this plugin and not the book.

This guide is for you if you want a feature that has a page in it. You can ask for it in plain words, bring a design of the page, or point at a page you want yours to look like. It says what to bring, what comes back before any code, and how the choices you keep are kept. You type no command yourself. What you bring guides the agent, and you are never made to take its advice.

## What you can bring

1. **Words.** Who uses the page, what they get done, and what they see once it is done. Words alone are enough.
2. **A design of your page.** A Figma link, an image, a PDF or slides, a sketch on paper or a whiteboard, a page of your product as it runs today, or HTML. The agent reads it and keeps whatever fits.
3. **A page you like.** A picture or the public address of another product's page, or a style described in words. The agent uses it only to choose between two answers that both fit, and never copies it.
4. **Both.** Your design leads. The page you like counts only where your design is silent, such as a state you did not draw.

With a Figma link and no Figma connection in the window, the agent tells you and asks for an image of each frame. It never writes into your Figma file, and it never signs in to your product.

## What you get back, before any code

No code is written yet. You get one reply, in this order:

1. **The rows, in your words**, one line each: who does what, and what they see. Where you gave none, the agent drafts them from your words, and asks who the person is where your words do not say.
2. **Your design, as read**, where you brought one: its parts in your order, with anything it could not read marked *not shown*. Its questions come together in one message, such as what a dropdown chooses from. It never asks for a size, a colour or a font, because your theme holds those.
3. **The picture of the page.** With your design, it is your design, with each state the agent added written beside the frame it belongs to. With no design, the agent draws the page once, with its errors where they appear.
4. **The states the agent added**: the ones your design did not show, such as while it works, when it fails, when the list is empty, and when a person may not act.
5. **The changes your users would feel**, one row each: the gain or the loss first, then where it is and why.

## How you answer

Once, on the changes your users would feel.

- On a change that comes from your design, say **keep yours** or **take ours**.
- On a change that comes from a page you pointed at, say **as the tree has it** or **bring it into my design**. A line that says it follows your page needs no answer.

A choice you keep stays kept. The agent writes it down with your words and the date, builds it the way you chose, and later reviews raise nothing on it.

## Where it is kept

The rows you accept go into your module's docs, where the build and later windows read them. Each choice you kept goes into the code as one comment on the line it concerns, with its reason, so the reason travels with the code.

The agent's working is not kept in your docs: the tree of blocks, the states and the picture. They are shown in the reply, the build follows them, and once the page is built the code says the same. Ask for the tree, and the agent shows it in full.

## When it is built

After you say go, and not before. The page is then built from the tree, and it matches your design except where you took ours.

## If something looks wrong

| You see | What to do |
| --- | --- |
| a question your design should have answered | the picture does not show the answer, such as what a menu holds. Answer in a line, or send a screenshot of that state |
| a choice of yours changed | say **keep yours** on that row. It is written down and built as you chose |
| no tree in the reply | the tree is always written for the build. Ask for it, and the agent shows it in full |
| you want the page drawn in Figma | ask. The agent draws it from the published library, never into your own file |
