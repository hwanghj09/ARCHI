using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody2D), typeof(SpriteRenderer))]
public sealed class PlayerMovement : MonoBehaviour
{
    [SerializeField, Min(0f)] private float moveSpeed = 4f;
    [SerializeField, Min(1f)] private float animationFramesPerSecond = 8f;
    [SerializeField] private Sprite[] walkFrames = System.Array.Empty<Sprite>();

    private Rigidbody2D body;
    private SpriteRenderer spriteRenderer;
    private float moveInput;
    private float animationTime;

    private void Awake()
    {
        body = GetComponent<Rigidbody2D>();
        spriteRenderer = GetComponent<SpriteRenderer>();

        if (walkFrames.Length > 0)
        {
            spriteRenderer.sprite = walkFrames[0];
        }
    }

    private void Update()
    {
        moveInput = ReadHorizontalInput();
        UpdateAnimation();
    }

    private void FixedUpdate()
    {
        body.linearVelocity = new Vector2(moveInput * moveSpeed, body.linearVelocity.y);
    }

    private void OnDisable()
    {
        if (body != null)
        {
            body.linearVelocity = Vector2.zero;
        }
    }

    private static float ReadHorizontalInput()
    {
        float input = 0f;

        if (Keyboard.current != null)
        {
            input = (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed ? 1f : 0f)
                - (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed ? 1f : 0f);
        }

        if (Gamepad.current != null && Mathf.Abs(Gamepad.current.leftStick.x.ReadValue()) > Mathf.Abs(input))
        {
            input = Gamepad.current.leftStick.x.ReadValue();
        }

        return input;
    }

    private void UpdateAnimation()
    {
        if (walkFrames.Length == 0)
        {
            return;
        }

        if (Mathf.Approximately(moveInput, 0f))
        {
            animationTime = 0f;
            spriteRenderer.sprite = walkFrames[0];
            return;
        }

        spriteRenderer.flipX = moveInput < 0f;
        animationTime += Time.deltaTime;
        int frameIndex = (int)(animationTime * animationFramesPerSecond) % walkFrames.Length;
        spriteRenderer.sprite = walkFrames[frameIndex];
    }
}
